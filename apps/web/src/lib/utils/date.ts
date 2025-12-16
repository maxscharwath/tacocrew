/**
 * Date utility functions using date-fns
 * Provides type-safe date parsing and conversion
 */

import { type DateArg, isValid, parse, toDate } from 'date-fns';

export type DateInput = DateArg<Date>;

export { toDate } from 'date-fns';

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

/**
 * Combines a date string (YYYY-MM-DD) and time string (HH:mm) into an ISO date string
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:mm format
 * @returns ISO date string
 *
 * @example
 * ```ts
 * combineDateAndTime('2024-01-15', '14:30') // '2024-01-15T14:30:00.000Z'
 * ```
 */
export function combineDateAndTime(dateStr: string, timeStr: string): string {
  const dateTime = parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
  if (!isValid(dateTime)) {
    throw new Error(`Invalid date/time: ${dateStr} ${timeStr}`);
  }
  return dateTime.toISOString();
}
