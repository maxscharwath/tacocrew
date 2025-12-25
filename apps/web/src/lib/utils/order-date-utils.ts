/**
 * Order date and time utilities
 * Centralized date manipulation for order creation and management
 */

import { addHours, format, setHours, setMinutes } from 'date-fns';
import { combineDateAndTime, toDate } from '@/lib/utils/date';

/**
 * Normalize date string by adding seconds if missing
 */
export function normalizeDateString(dateStr: string): string {
  if (dateStr.includes(':') && !dateStr.includes('Z') && !dateStr.includes('+')) {
    return `${dateStr}:00`;
  }
  return dateStr;
}

/**
 * Validate and convert date strings to Date objects
 */
export function validateDates(
  startDateStr: string,
  endDateStr: string
): { startDate: Date; endDate: Date } | Response {
  const startDate = new Date(normalizeDateString(startDateStr));
  const endDate = new Date(normalizeDateString(endDateStr));

  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    return Response.json(
      {
        form: 'create',
        errorKey: 'errors.validation.failed',
        errorMessage: 'Invalid date format. Please check your dates and times.',
      },
      { status: 400 }
    );
  }

  if (endDate <= startDate) {
    return Response.json(
      {
        form: 'create',
        errorKey: 'errors.validation.failed',
        errorMessage: 'End date must be after start date.',
      },
      { status: 400 }
    );
  }

  return { startDate, endDate };
}

/**
 * Calculate default end time based on start date/time
 * Tries common deadlines: 5pm, 2pm, 12pm, or 3 hours later
 */
export function getDefaultEndTime(startDateValue: string, startTimeValue: string): string {
  const startDateTime = toDate(combineDateAndTime(startDateValue, startTimeValue));

  // Try common deadlines: 5pm (17:00), 2pm (14:00), 12pm (12:00), or 3 hours later
  const commonDeadlines = [17, 14, 12];

  // Find the first common deadline that's at least 1 hour after start time
  for (const deadlineHour of commonDeadlines) {
    const endDateTime = setHours(startDateTime, deadlineHour);
    const hoursDiff = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    if (hoursDiff >= 1) {
      return endDateTime.toISOString();
    }
  }

  // If no common deadline works, default to 3 hours later (minimum 1 hour)
  let endDateTime = addHours(startDateTime, 3);
  // Ensure at least 1-hour difference
  if (endDateTime <= startDateTime) {
    endDateTime = addHours(startDateTime, 1);
  }
  return endDateTime.toISOString();
}

/**
 * Get minimum date/time info for closes based on start date/time
 */
export function getMinDateTime(startDateValue: string): {
  date: string;
  datetime: Date;
} {
  const startDateTime = new Date(startDateValue);
  const dateStr = format(startDateTime, 'yyyy-MM-dd');
  return {
    date: dateStr,
    datetime: startDateTime,
  };
}

/**
 * Set quick deadline at specified hour
 */
export function calculateQuickDeadline(startDateValue: string, hour: number): string {
  if (!startDateValue) return '';

  const minDateTime = getMinDateTime(startDateValue);
  // Set hour and minutes to 00 using date-fns
  let deadline = setMinutes(setHours(minDateTime.datetime, hour), 0);

  // If the deadline time is before or equal to the start time, move to next day
  if (deadline <= minDateTime.datetime) {
    deadline = setMinutes(addHours(setHours(minDateTime.datetime, hour), 24), 0);
  }

  return deadline.toISOString();
}

/**
 * Validate and auto-adjust end date when start date changes
 */
export function validateAndAdjustEndDate(
  startDateValue: string,
  endDateValue: string,
  getDefaultEnd: (startDate: string, startTime: string) => string
): string {
  if (!startDateValue || !endDateValue) return endDateValue;

  const minDateTime = getMinDateTime(startDateValue);
  const endDateTime = new Date(endDateValue);

  // If end is before start, recalculate default end time based on new start
  if (endDateTime < minDateTime.datetime) {
    const dateStr = format(minDateTime.datetime, 'yyyy-MM-dd');
    const timeStr = format(minDateTime.datetime, 'HH:mm');
    return getDefaultEnd(dateStr, timeStr);
  }

  return endDateValue;
}
