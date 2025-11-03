/**
 * Resource routes for Hono
 * @module hono/routes/resource
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { jsonContent, ResourceSchemas } from '@/hono/routes/resource.schemas';
import { ResourceService } from '@/services/resource.service';
import { inject } from '@/utils/inject';

const app = new OpenAPIHono();

const stockRoute = createRoute({
  method: 'get',
  path: '/resources/stock',
  tags: ['Resources'],
  security: [],
  responses: {
    200: {
      description: 'Stock availability',
      content: jsonContent(ResourceSchemas.StockAvailabilitySchema),
    },
  },
});

app.openapi(stockRoute, async (c) => {
  const resourceService = inject(ResourceService);
  const stock = await resourceService.getStock();
  return c.json(stock, 200);
});

export const resourceRoutes = app;
