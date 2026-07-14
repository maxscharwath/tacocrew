/**
 * User order schemas (request and response)
 * @module api/schemas/user-order
 */

import { z } from '@hono/zod-openapi';
import { AmountSchema } from '@/api/schemas/shared.schemas';
import { TacoSize } from '@/domain/taco-config';
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

import { TacoKind } from '@/schemas/taco.schema';

const RegularTacoSchema = z.object({
  id: TacoId,
  size: z.enum(TacoSize),
  meats: z.array(MeatSchema),
  sauces: z.array(SauceSchema),
  garnitures: z.array(GarnitureSchema),
  note: z.string().optional(),
  price: AmountSchema,
  tacoID: z.string().min(1), // base58-encoded tacoID - required for regular tacos
  kind: z.literal(TacoKind.REGULAR),
});

const MysteryTacoSchema = z.object({
  id: TacoId,
  size: z.enum(TacoSize),
  note: z.string().optional(),
  price: AmountSchema,
  kind: z.literal(TacoKind.MYSTERY),
});

export const TacoSchema = z.discriminatedUnion('kind', [RegularTacoSchema, MysteryTacoSchema]);

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

export const CroustyOptionSelectionSchema = z.object({
  groupName: z.string(),
  optionName: z.string(),
});

export const CroustySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  variant: z.enum(['sweet', 'spicy', 'custom']),
  price: AmountSchema,
  quantity: z.number().int().min(1),
  options: z.array(CroustyOptionSelectionSchema),
});

export const UserOrderItemsSchema = z.object({
  tacos: z.array(TacoSchema),
  extras: z.array(ExtraSchema),
  drinks: z.array(DrinkSchema),
  desserts: z.array(DessertSchema),
  crousties: z.array(CroustySchema).default([]),
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

// Taco request (size, meats, sauces, garnitures, note, quantity, kind)
export const TacoRequestSchema = z.object({
  size: z.enum(TacoSize),
  meats: z.array(MeatRequestSchema),
  sauces: z.array(SauceRequestSchema),
  garnitures: z.array(GarnitureRequestSchema),
  note: z.string().optional(),
  quantity: z.number().int().min(1).optional().default(1),
  kind: z.enum(TacoKind).optional().default(TacoKind.REGULAR),
});

// Extra, Drink, Dessert requests (id with optional quantity)
export const ExtraRequestSchema = ItemRequestSchema(ExtraId);
export const DrinkRequestSchema = ItemRequestSchema(DrinkId);
export const DessertRequestSchema = ItemRequestSchema(DessertId);

// Crousty request: product code + chosen options (by group/option name) + quantity.
// The server resolves name/price/variant from stock.crousties.
export const CroustyOptionSelectionRequestSchema = z.object({
  groupName: z.string().min(1),
  optionName: z.string().min(1),
});

export const CroustyRequestSchema = z.object({
  code: z.string().min(1),
  options: z.array(CroustyOptionSelectionRequestSchema).default([]),
  quantity: z.number().int().min(1).optional().default(1),
});

// User order items request schema
export const UserOrderItemsRequestSchema = z.object({
  tacos: z.array(TacoRequestSchema),
  extras: z.array(ExtraRequestSchema),
  drinks: z.array(DrinkRequestSchema),
  desserts: z.array(DessertRequestSchema),
  crousties: z.array(CroustyRequestSchema).default([]),
});

/**
 * Create user order request DTO (only IDs)
 */
export type CreateUserOrderRequestDto = {
  items: z.infer<typeof UserOrderItemsRequestSchema>;
};
