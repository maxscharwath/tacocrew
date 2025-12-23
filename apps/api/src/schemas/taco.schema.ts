/**
 * Taco domain schema (Zod)
 * @module schemas/taco
 */

import { TacoSize } from '@tacocrew/gigatacos-client';
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
export const MeatId = zId<MeatId>();

/**
 * Sauce ID type - branded string
 */
export type SauceId = Id<'Sauce'>;

/**
 * Parse a string to SauceId
 */
export const SauceId = zId<SauceId>();

/**
 * Garniture ID type - branded string
 */
export type GarnitureId = Id<'Garniture'>;

/**
 * Parse a string to GarnitureId
 */
export const GarnitureId = zId<GarnitureId>();

/**
 * Taco ID type - branded string
 */
export type TacoId = Id<'Taco'>;

/**
 * Parse a string to TacoId
 */
export const TacoId = zId<TacoId>();

/**
 * Meat ingredient schema
 */
export const MeatSchema = z.object({
  id: MeatId,
  code: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
});

export type Meat = z.infer<typeof MeatSchema>;

/**
 * Sauce ingredient schema
 */
export const SauceSchema = z.object({
  id: SauceId,
  code: z.string(),
  name: z.string(),
});

export type Sauce = z.infer<typeof SauceSchema>;

/**
 * Garniture ingredient schema
 */
export const GarnitureSchema = z.object({
  id: GarnitureId,
  code: z.string(),
  name: z.string(),
});

export type Garniture = z.infer<typeof GarnitureSchema>;

/**
 * Taco kind enum
 */
export enum TacoKind {
  REGULAR = 'regular',
  MYSTERY = 'mystery',
}

/**
 * Regular Taco schema - has tacoID (recipe-based identifier)
 * Each taco object represents a single taco. For multiple tacos, create multiple objects.
 */
export const RegularTacoSchema = z.object({
  id: TacoId,
  size: z.enum(TacoSize),
  meats: z.array(MeatSchema),
  sauces: z.array(SauceSchema),
  garnitures: z.array(GarnitureSchema),
  note: z.string().optional(),
  price: z.number().min(0),
  tacoID: z.string().min(1), // base58-encoded tacoID - required for regular tacos
  kind: z.literal(TacoKind.REGULAR),
});

/**
 * Mystery Taco schema - no tacoID, no ingredients (chef picks everything, only size is required)
 * Each taco object represents a single taco. For multiple tacos, create multiple objects.
 */
export const MysteryTacoSchema = z.object({
  id: TacoId,
  size: z.enum(TacoSize),
  note: z.string().optional(),
  price: z.number().min(0),
  kind: z.literal(TacoKind.MYSTERY),
});

/**
 * Taco schema - discriminated union of RegularTaco and MysteryTaco
 */
export const TacoSchema = z.discriminatedUnion('kind', [
  RegularTacoSchema,
  MysteryTacoSchema,
]);

export type RegularTaco = z.infer<typeof RegularTacoSchema>;
export type MysteryTaco = z.infer<typeof MysteryTacoSchema>;
export type Taco = z.infer<typeof TacoSchema>;
