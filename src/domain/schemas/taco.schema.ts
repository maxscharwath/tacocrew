/**
 * Taco domain schema (Zod)
 * @module domain/schemas/taco
 */

import { z } from 'zod';
import { TacoSize } from '@/types';

/**
 * Meat ingredient schema
 */
export const MeatSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
});

export type Meat = z.infer<typeof MeatSchema>;

/**
 * Sauce ingredient schema
 */
export const SauceSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
});

export type Sauce = z.infer<typeof SauceSchema>;

/**
 * Garniture ingredient schema
 */
export const GarnitureSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
});

export type Garniture = z.infer<typeof GarnitureSchema>;

/**
 * Taco schema using Zod
 */
export const TacoSchema = z.object({
  id: z.string(),
  size: z.nativeEnum(TacoSize),
  meats: z.array(MeatSchema),
  sauces: z.array(SauceSchema),
  garnitures: z.array(GarnitureSchema),
  note: z.string().optional(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
});

export type Taco = z.infer<typeof TacoSchema>;
