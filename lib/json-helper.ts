/**
 * Safely parse JSON with fallback value
 * Prevents JSON.parse errors from crashing the application
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  if (!jsonString || jsonString.trim() === '') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Safely stringify data to JSON
 */
export function safeJsonStringify(data: unknown, fallback: string = '{}'): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('JSON stringify error:', error);
    return fallback;
  }
}

/**
 * Validate that a value is an array
 */
export function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Validate that a value is an object
 */
export function isValidObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
