/**
 * Date utility functions using date-fns
 * Provides type-safe date parsing and conversion
 */

import { isValid, parseISO } from 'date-fns';

/**
 * Type for date values that can be converted to Date objects
 */
export type DateInput = string | Date | number;

/**
 * Safely converts a date input to a Date object using date-fns
 * Prefers parseISO for ISO strings, falls back to new Date() for other formats
 *
 * @param value - Date string (ISO or other format), Date object, or timestamp
 * @returns Date object, or throws if invalid
 *
 * @example
 * ```ts
 * toDate('2024-01-15T10:30:00Z') // Date object
 * toDate(new Date()) // Date object
 * toDate('2024-01-15') // Date object (parsed as ISO)
 * ```
 */
export function toDate(value: DateInput): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (typeof value === 'string') {
    // Try parseISO first for ISO strings (handles timezone correctly)
    try {
      const parsed = parseISO(value);
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to new Date() if parseISO fails
    }

    // Fallback to new Date() for non-ISO strings
    const fallback = new Date(value);
    if (isValid(fallback)) {
      return fallback;
    }

    throw new Error(`Invalid date string: ${value}`);
  }

  throw new Error(`Invalid date input type: ${typeof value}`);
}

/**
 * Safely converts a date input to a Date object, returning null if invalid
 * Useful when you want to handle invalid dates gracefully
 *
 * @param value - Date string, Date object, or timestamp
 * @returns Date object or null if invalid
 */
export function toDateOrNull(value: DateInput | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return toDate(value);
  } catch {
    return null;
  }
}
