/**
 * Health check routes for Hono
 * @module hono/routes/health
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { IsoDateStringSchema } from '@/hono/routes/shared.schemas';

const app = new OpenAPIHono();

const HealthStatusSchema = z.literal('healthy');

const HealthResponseSchema = z.object({
  status: HealthStatusSchema,
  timestamp: IsoDateStringSchema,
  uptime: z.number(),
});

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  security: [],
  responses: {
    200: {
      description: 'Health status',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

app.openapi(healthRoute, (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export const healthRoutes = app;
