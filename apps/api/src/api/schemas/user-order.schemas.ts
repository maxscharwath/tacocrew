/**
 * User order schemas (request and response)
 * @module api/schemas/user-order
 */

import { z } from '@hono/zod-openapi';
import { TacoSize } from '@tacobot/gigatacos-client';
import { AmountSchema } from '@/api/schemas/shared.schemas';
import { DessertId } from '@/schemas/dessert.schema';
import { DrinkId } from '@/schemas/drink.schema';
import { ExtraId, FreeSauceId } from '@/schemas/extra.schema';
import { GarnitureId, MeatId, SauceId, TacoId } from '@/schemas/taco.schema';

// Response schemas (full item details for responses)
export const FreeSauceSchema = z.object({
  id: FreeSauceId,
  code: z.string(),
  name: z.string(),
  price: AmountSchema,
});

export const MeatSchema = z.object({
  id: MeatId,
  code: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
});

export const SauceSchema = z.object({
  id: SauceId,
  code: z.string(),
  name: z.string(),
});

export const GarnitureSchema = z.object({
  id: GarnitureId,
  code: z.string(),
  name: z.string(),
});

export const TacoSchema = z.object({
  id: TacoId,
  size: z.enum(TacoSize),
  meats: z.array(MeatSchema),
  sauces: z.array(SauceSchema),
  garnitures: z.array(GarnitureSchema),
  note: z.string().optional(),
  quantity: z.number().int().min(1),
  price: AmountSchema,
  tacoID: z.string().min(1), // base58-encoded tacoID (Bitcoin-style identifier) - always required
});

export const ExtraSchema = z.object({
  id: ExtraId,
  code: z.string(),
  name: z.string(),
  price: AmountSchema,
  quantity: z.number().int().min(1),
  free_sauce: FreeSauceSchema.optional(),
  free_sauces: z.array(FreeSauceSchema).optional(),
});

export const DrinkSchema = z.object({
  id: DrinkId,
  code: z.string(),
  name: z.string(),
  price: AmountSchema,
  quantity: z.number().int().min(1),
});

export const DessertSchema = z.object({
  id: DessertId,
  code: z.string(),
  name: z.string(),
  price: AmountSchema,
  quantity: z.number().int().min(1),
});

export const UserOrderItemsSchema = z.object({
  tacos: z.array(TacoSchema),
  extras: z.array(ExtraSchema),
  drinks: z.array(DrinkSchema),
  desserts: z.array(DessertSchema),
});

// Request schemas (only id and quantity)

// Base schema for items with optional quantity (defaults to 1)
const ItemRequestSchema = <T extends z.ZodTypeAny>(idSchema: T) =>
  z.object({
    id: idSchema,
    quantity: z.number().int().min(1).optional().default(1),
  });

// Meat request (id with optional quantity, defaults to 1)
export const MeatRequestSchema = ItemRequestSchema(MeatId);

// Sauce and Garniture requests (id only)
export const SauceRequestSchema = z.object({
  id: SauceId,
});

export const GarnitureRequestSchema = z.object({
  id: GarnitureId,
});

// Taco request (size, meats, sauces, garnitures, note, quantity)
export const TacoRequestSchema = z.object({
  size: z.enum(TacoSize),
  meats: z.array(MeatRequestSchema),
  sauces: z.array(SauceRequestSchema),
  garnitures: z.array(GarnitureRequestSchema),
  note: z.string().optional(),
  quantity: z.number().int().min(1).optional().default(1),
});

// Extra, Drink, Dessert requests (id with optional quantity)
export const ExtraRequestSchema = ItemRequestSchema(ExtraId);
export const DrinkRequestSchema = ItemRequestSchema(DrinkId);
export const DessertRequestSchema = ItemRequestSchema(DessertId);

// User order items request schema
export const UserOrderItemsRequestSchema = z.object({
  tacos: z.array(TacoRequestSchema),
  extras: z.array(ExtraRequestSchema),
  drinks: z.array(DrinkRequestSchema),
  desserts: z.array(DessertRequestSchema),
});

/**
 * Create user order request DTO (only IDs)
 */
export type CreateUserOrderRequestDto = {
  items: z.infer<typeof UserOrderItemsRequestSchema>;
};
