import { z } from '@hono/zod-openapi';
import { ErrorResponseSchema, jsonContent } from '@/hono/routes/shared.schemas';

const StockItemSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  in_stock: z.boolean(),
});

const StockAvailabilitySchema = z.object({
  meats: z.array(StockItemSchema),
  sauces: z.array(StockItemSchema),
  garnishes: z.array(StockItemSchema),
  desserts: z.array(StockItemSchema),
  drinks: z.array(StockItemSchema),
  extras: z.array(StockItemSchema),
});

export const ResourceSchemas = {
  StockAvailabilitySchema,
  ErrorResponseSchema,
};

export { jsonContent };
