/**
 * User order schemas (request and response)
 * @module api/schemas/user-order
 */

import { z } from '@hono/zod-openapi';
import { AmountSchema } from '@/api/schemas/shared.schemas';
import { DessertIdSchema } from '@/schemas/dessert.schema';
import { DrinkIdSchema } from '@/schemas/drink.schema';
import { ExtraIdSchema, FreeSauceIdSchema } from '@/schemas/extra.schema';
import {
  GarnitureIdSchema,
  MeatIdSchema,
  SauceIdSchema,
  TacoIdSchema,
} from '@/schemas/taco.schema';
import { TacoSize } from '@/shared/types/types';

// Response schemas (full item details for responses)
export const FreeSauceSchema = z.object({
  id: FreeSauceIdSchema,
  code: z.string(),
  name: z.string(),
  price: AmountSchema,
});

export const MeatSchema = z.object({
  id: MeatIdSchema,
  code: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
});

export const SauceSchema = z.object({
  id: SauceIdSchema,
  code: z.string(),
  name: z.string(),
});

export const GarnitureSchema = z.object({
  id: GarnitureIdSchema,
  code: z.string(),
  name: z.string(),
});

export const TacoSchema = z.object({
  id: TacoIdSchema,
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
  id: ExtraIdSchema,
  code: z.string(),
  name: z.string(),
  price: AmountSchema,
  quantity: z.number().int().min(1),
  free_sauce: FreeSauceSchema.optional(),
  free_sauces: z.array(FreeSauceSchema).optional(),
});

export const DrinkSchema = z.object({
  id: DrinkIdSchema,
  code: z.string(),
  name: z.string(),
  price: AmountSchema,
  quantity: z.number().int().min(1),
});

export const DessertSchema = z.object({
  id: DessertIdSchema,
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
export const MeatRequestSchema = ItemRequestSchema(MeatIdSchema);

// Sauce and Garniture requests (id only)
export const SauceRequestSchema = z.object({
  id: SauceIdSchema,
});

export const GarnitureRequestSchema = z.object({
  id: GarnitureIdSchema,
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
export const ExtraRequestSchema = ItemRequestSchema(ExtraIdSchema);
export const DrinkRequestSchema = ItemRequestSchema(DrinkIdSchema);
export const DessertRequestSchema = ItemRequestSchema(DessertIdSchema);

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
