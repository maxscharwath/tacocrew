/**
 * Time slot type
 * @module shared/types/time-slot
 */

import { z } from 'zod';
import type { Brand } from '@/shared/utils/branded-ids.utils';

/**
 * Time slot type - branded string in HH:MM format (e.g., "15:00")
 */
export type TimeSlot = Brand<string, 'TimeSlot'>;

/**
 * Time slot schema - validates HH:MM format
 */
export const TimeSlotSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Time slot must be in HH:MM format (e.g., "15:00")')
  .refine(
    (value) => {
      const parts = value.split(':');
      if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
      const hours = Number.parseInt(parts[0], 10);
      const minutes = Number.parseInt(parts[1], 10);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    },
    {
      message: 'Time slot must have valid hours (00-23) and minutes (00-59)',
    }
  )
  .transform((val) => val as TimeSlot);
