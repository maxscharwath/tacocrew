/**
 * Dessert domain schema (Zod)
 * @module domain/schemas/dessert
 */

import { z } from 'zod';
import type { Id } from '@/domain/entities/branded-types';
import { zId } from '@/domain/entities/branded-types';

/**
 * Dessert ID type - branded string
 */
export type DessertId = Id<'Dessert'>;

/**
 * Parse a string to DessertId
 */
export const DessertIdSchema = zId<DessertId>();

/**
 * Dessert schema using Zod
 */
export const DessertSchema = z.object({
  id: zId<DessertId>(),
  code: z.string(),
  name: z.string(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
});

export type Dessert = z.infer<typeof DessertSchema>;
