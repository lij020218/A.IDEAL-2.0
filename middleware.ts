import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = process.env.NODE_ENV === 'development'
  ? 10000 // Very high limit for development
  : 100; // 100 requests per window in production

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or forwarded IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : request.ip ?? 'unknown';
  return `ratelimit:${ip}`;
}

function checkRateLimit(key: string): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let info = rateLimitMap.get(key);

  if (!info || info.resetTime < now) {
    // Start new window
    info = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
    rateLimitMap.set(key, info);
    return {
      success: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: info.resetTime,
    };
  }

  if (info.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      success: false,
      remaining: 0,
      resetTime: info.resetTime,
    };
  }

  info.count++;
  return {
    success: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - info.count,
    resetTime: info.resetTime,
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key of Array.from(rateLimitMap.keys())) {
    const info = rateLimitMap.get(key);
    if (info && info.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Cleanup every minute

export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes only
  if (request.nextUrl.pathname.startsWith('/api')) {
    const rateLimitKey = getRateLimitKey(request);
    const { success, remaining, resetTime } = checkRateLimit(rateLimitKey);

    if (!success) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요." },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
