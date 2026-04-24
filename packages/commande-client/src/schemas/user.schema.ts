import { z } from 'zod';

export const smsRequirementSchema = z.object({
  required: z.boolean(),
  newNumber: z.boolean().optional(),
});
