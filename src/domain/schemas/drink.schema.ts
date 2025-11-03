/**
 * Drink domain schema (Zod)
 * @module domain/schemas/drink
 */

import { z } from 'zod';
import type { Id } from '@/domain/entities/branded-types';
import { zId } from '@/domain/entities/branded-types';

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
