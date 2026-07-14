import { z } from 'zod';
import type { SmsRequirement } from '../types';

// Real `user.checkSmsRequirementPublic` payload (captured 2026-07 via HAR):
// { restaurantRequiresSms, alreadyVerified }.
export const smsRequirementSchema = z
  .object({
    restaurantRequiresSms: z.boolean(),
    alreadyVerified: z.boolean().optional(),
  })
  .passthrough()
  .transform(
    (raw): SmsRequirement => ({
      required: raw.restaurantRequiresSms,
      ...(raw.alreadyVerified !== undefined && { alreadyVerified: raw.alreadyVerified }),
    })
  );
