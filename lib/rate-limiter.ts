/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based rate limiting (e.g., @upstash/ratelimit)
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private cache = new Map<string, RateLimitInfo>();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async check(identifier: string): Promise<{ success: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();

    let info = this.cache.get(identifier);

    if (!info || info.resetTime < now) {
      // Start new window
      info = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      this.cache.set(identifier, info);
      return {
        success: true,
        remaining: this.config.maxRequests - 1,
        resetTime: info.resetTime,
      };
    }

    if (info.count >= this.config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: info.resetTime,
      };
    }

    info.count++;
    return {
      success: true,
      remaining: this.config.maxRequests - info.count,
      resetTime: info.resetTime,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const key of Array.from(this.cache.keys())) {
      const info = this.cache.get(key);
      if (info && info.resetTime < now) {
        this.cache.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Export preconfigured rate limiters
export const generalLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

export const authLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
});

export const aiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
});

export const uploadLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
});
