/**
 * Secure logging utility
 * Prevents sensitive information leakage in production logs
 */

export function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV === 'development') {
    // In development, log full error details
    console.error(`[${context}]`, error);
  } else {
    // In production, log only safe information
    console.error(`[${context}]`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    // TODO: Send to external logging service (Sentry, DataDog, etc.)
    // if (typeof window === 'undefined') {
    //   Sentry.captureException(error, { tags: { context } });
    // }
  }
}

export function logInfo(context: string, message: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${context}]`, message, data);
  }
  // In production, consider using a proper logging service
}

export function logWarning(context: string, message: string, data?: Record<string, unknown>) {
  console.warn(`[${context}]`, message, data);
}
