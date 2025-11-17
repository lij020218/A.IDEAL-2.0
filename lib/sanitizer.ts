import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content while allowing safe tags
 * Use this for user-generated content that may contain formatting
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text by removing all HTML tags
 * Use this for titles, names, and other plain text fields
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 10000); // Enforce maximum length
}

/**
 * Sanitize code snippets
 * Preserves code formatting but removes dangerous content
 */
export function sanitizeCode(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .slice(0, 50000); // Longer limit for code
}

/**
 * Sanitize URLs to prevent XSS
 */
export function sanitizeUrl(input: string): string {
  try {
    const url = new URL(input);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
    return url.toString();
  } catch {
    return '';
  }
}
