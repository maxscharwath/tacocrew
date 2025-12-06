/**
 * Taco domain schema (Zod)
 * @module schemas/taco
 */

import { TacoSize } from '@tacobot/gigatacos-client';
import { z } from 'zod';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';

/**
 * Meat ID type - branded string
 */
export type MeatId = Id<'Meat'>;

/**
 * Parse a string to MeatId
 */
export const MeatIdSchema = zId<MeatId>();

/**
 * Sauce ID type - branded string
 */
export type SauceId = Id<'Sauce'>;

/**
 * Parse a string to SauceId
 */
export const SauceIdSchema = zId<SauceId>();

/**
 * Garniture ID type - branded string
 */
export type GarnitureId = Id<'Garniture'>;

/**
 * Parse a string to GarnitureId
 */
export const GarnitureIdSchema = zId<GarnitureId>();

/**
 * Taco ID type - branded string
 */
export type TacoId = Id<'Taco'>;

/**
 * Parse a string to TacoId
 */
export const TacoIdSchema = zId<TacoId>();

/**
 * Meat ingredient schema
 */
export const MeatSchema = z.object({
  id: zId<MeatId>(),
  code: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
});

export type Meat = z.infer<typeof MeatSchema>;

/**
 * Sauce ingredient schema
 */
export const SauceSchema = z.object({
  id: zId<SauceId>(),
  code: z.string(),
  name: z.string(),
});

export type Sauce = z.infer<typeof SauceSchema>;

/**
 * Garniture ingredient schema
 */
export const GarnitureSchema = z.object({
  id: zId<GarnitureId>(),
  code: z.string(),
  name: z.string(),
});

export type Garniture = z.infer<typeof GarnitureSchema>;

/**
 * Taco schema using Zod
 */
export const TacoSchema = z.object({
  id: zId<TacoId>(),
  size: z.enum(TacoSize),
  meats: z.array(MeatSchema),
  sauces: z.array(SauceSchema),
  garnitures: z.array(GarnitureSchema),
  note: z.string().optional(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  tacoID: z.string().min(1), // base58-encoded tacoID (Bitcoin-style identifier) - always required
});

export type Taco = z.infer<typeof TacoSchema>;
