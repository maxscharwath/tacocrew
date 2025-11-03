/**
 * Extra domain schema (Zod)
 * @module domain/schemas/extra
 */

import { z } from 'zod';
import type { Id } from '@/domain/entities/branded-types';
import { zId } from '@/domain/entities/branded-types';

/**
 * Extra ID type - branded string
 */
export type ExtraId = Id<'Extra'>;

/**
 * Parse a string to ExtraId
 */
export const ExtraIdSchema = zId<ExtraId>();

/**
 * Free sauce schema
 */
export const FreeSauceSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
});

export type FreeSauce = z.infer<typeof FreeSauceSchema>;

/**
 * Extra schema using Zod
 */
export const ExtraSchema = z.object({
  id: zId<ExtraId>(),
  code: z.string(),
  name: z.string(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  free_sauce: FreeSauceSchema.optional(),
  free_sauces: z.array(FreeSauceSchema).optional(),
});

export type Extra = z.infer<typeof ExtraSchema>;
