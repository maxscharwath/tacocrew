/**
 * Resource routes
 * @module api/routes/resource
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { jsonContent } from '@/api/schemas/shared.schemas';
import { createRouteApp } from '@/api/utils/route.utils';
import { ResourceService } from '@/services/resource/resource.service';
import { TacoSize } from '@/shared/types/types';
import { inject } from '@/shared/utils/inject.utils';

const app = createRouteApp();

const StockItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  price: z.number().optional(),
  in_stock: z.boolean(),
});

const TacoSizeItemSchema = z.object({
  id: z.string(),
  code: z.enum(TacoSize),
  name: z.string(),
  price: z.number(),
  maxMeats: z.number(),
  maxSauces: z.number(),
  allowGarnitures: z.boolean(),
});

const StockAvailabilitySchema = z.object({
  meats: z.array(StockItemSchema),
  sauces: z.array(StockItemSchema),
  garnishes: z.array(StockItemSchema),
  extras: z.array(StockItemSchema),
  drinks: z.array(StockItemSchema),
  desserts: z.array(StockItemSchema),
  tacos: z.array(TacoSizeItemSchema),
});

app.openapi(
  createRoute({
    method: 'get',
    path: '/stock',
    tags: ['Resources'],
    responses: {
      200: {
        description: 'Stock availability',
        content: jsonContent(StockAvailabilitySchema),
      },
    },
  }),
  async (c) => {
    const resourceService = inject(ResourceService);
    const stock = await resourceService.getStock();
    return c.json(stock, 200);
  }
);

export const resourceRoutes = app;
