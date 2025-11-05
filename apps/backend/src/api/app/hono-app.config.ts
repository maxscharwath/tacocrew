/**
 * Hono Application Setup
 * @module api/app/hono-app.config
 */

import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { errorHandler } from '@/api/middleware/error-handler.middleware';
import { authRoutes } from '@/api/routes/auth.routes';
import { groupOrderRoutes } from '@/api/routes/group-order.routes';
import { healthRoutes } from '@/api/routes/health.routes';
import { resourceRoutes } from '@/api/routes/resource.routes';
import { userRoutes } from '@/api/routes/user.routes';
import { userOrderRoutes } from '@/api/routes/user-order.routes';
import { createRouteGroup } from '@/api/utils/route.utils';
import { debugRoutes } from '@/shared/utils/route-debugger.utils';

/**
 * Create and configure Hono application
 */
export function createApp(): OpenAPIHono {
  const app = new OpenAPIHono();

  // Request logging
  app.use('*', honoLogger());

  // CORS
  app.use(
    '*',
    cors({
      origin: '*', // Configure from config in production
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'x-username'],
    })
  );

  // The OpenAPI documentation is available at /docs (summary) and /openapi.json (full spec)
  // Note: Defined BEFORE routes to ensure they're not affected by route-level auth middleware
  app.get('/openapi.json', async (c) => {
    const openAPIDocument = await app.getOpenAPI31Document({
      openapi: '3.1.0',
      info: {
        title: 'Tacobot API',
        version: '1.0.0',
        description: 'API documentation for Tacobot group ordering system',
      },
    });

    // Ensure securitySchemes are included
    openAPIDocument.components = {
      ...openAPIDocument.components,
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT token authentication. Enter your token (with or without "Bearer " prefix)',
        },
        UsernameHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-username',
          description:
            'Username header authentication. Provide your username in the x-username header.',
        },
      },
    };

    return c.json(openAPIDocument);
  });

  app.get(
    '/docs',
    swaggerUI({
      url: '/openapi.json',
    })
  );

  // API routes (registered after docs to ensure docs are accessible)
  // Health and auth routes are at root level
  app.route('/', healthRoutes);
  app.route('/', authRoutes);

  // v1 API routes
  app.route(
    '/api/v1',
    createRouteGroup(resourceRoutes, userRoutes, groupOrderRoutes, userOrderRoutes)
  );

  // 404 handler
  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
        },
      },
      404
    );
  });

  // Error handler (must be last)
  app.onError(errorHandler);

  // Debug routes (automatically collected from the Hono app)
  const discoveredRoutes = app.routes.map((route) => ({
    method: (route.method || 'UNKNOWN').toUpperCase(),
    path: route.path,
  }));
  debugRoutes(discoveredRoutes, 'Hono');

  return app;
}
