/**
 * Drink domain schema (Zod)
 * @module schemas/drink
 */

import { z } from 'zod';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';

/**
 * Drink ID type - branded string
 */
export type DrinkId = Id<'Drink'>;

/**
 * Parse a string to DrinkId
 */
export const DrinkIdSchema = zId<DrinkId>();

/**
 * Drink schema using Zod
 */
export const DrinkSchema = z.object({
  id: zId<DrinkId>(),
  code: z.string(),
  name: z.string(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
});

export type Drink = z.infer<typeof DrinkSchema>;
