/**
 * Health check routes
 * @module api/routes/health
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { jsonContent } from '../schemas/shared.schemas';

const app = new OpenAPIHono();

const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
});

app.openapi(
  createRoute({
    method: 'get',
    path: '/health',
    tags: ['Health'],
    responses: {
      200: {
        description: 'Health check',
        content: jsonContent(HealthResponseSchema),
      },
    },
  }),
  (c) => {
    const response = HealthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
    return c.json(response, 200);
  }
);

export const healthRoutes = app;
