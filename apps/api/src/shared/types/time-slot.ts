/**
 * Time slot type
 * @module shared/types/time-slot
 */

import { z } from 'zod';
import type { Brand } from '../utils/branded-ids.utils';

/**
 * Time slot type - branded string in HH:MM format (e.g., "15:00")
 */
export type TimeSlot = Brand<string, 'TimeSlot'>;

/**
 * Time slot schema - validates HH:MM format or empty string
 */
export const TimeSlotSchema = z
  .string()
  .refine(
    (value) => {
      // Allow empty string
      if (value === '') return true;
      // Validate HH:MM format
      if (!/^\d{2}:\d{2}$/.test(value)) return false;
      const parts = value.split(':');
      if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
      const hours = Number.parseInt(parts[0], 10);
      const minutes = Number.parseInt(parts[1], 10);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    },
    {
      message:
        'Time slot must be empty or in HH:MM format (e.g., "15:00") with valid hours (00-23) and minutes (00-59)',
    }
  )
  .transform((val) => val as TimeSlot);
