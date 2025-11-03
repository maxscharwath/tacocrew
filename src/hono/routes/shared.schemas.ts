import type { OpenAPIZodSchema } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';

export const IsoDateStringSchema = z.string().datetime();

export const IsoDateSchema = IsoDateStringSchema.transform((value) => new Date(value));

export const FreeSauceSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
});

export const MeatSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
});

export const SauceSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
});

export const GarnitureSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
});

export const TacoSchema = z.object({
  id: z.string(),
  size: z.string(),
  meats: z.array(MeatSchema),
  sauces: z.array(SauceSchema),
  garnitures: z.array(GarnitureSchema),
  note: z.string().optional(),
  quantity: z.number().int().min(1),
  price: z.number().optional(),
});

export const ExtraSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
  free_sauce: FreeSauceSchema.optional(),
  free_sauces: z.array(FreeSauceSchema).optional(),
});

export const DrinkSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
});

export const DessertSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
});

export const UserOrderItemsSchema = z.object({
  tacos: z.array(TacoSchema),
  extras: z.array(ExtraSchema),
  drinks: z.array(DrinkSchema),
  desserts: z.array(DessertSchema),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const jsonContent = <T extends OpenAPIZodSchema>(schema: T) => ({
  'application/json': { schema },
});
