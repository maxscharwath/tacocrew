/**
 * Hono Application Setup
 * @module hono/app
 */

import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { errorHandler } from '@/hono/middleware/error-handler';
import { authRoutes } from '@/hono/routes/auth.routes';
import { cartRoutes } from '@/hono/routes/cart.routes';
import { groupOrderRoutes } from '@/hono/routes/group-order.routes';
import { healthRoutes } from '@/hono/routes/health.routes';
import { resourceRoutes } from '@/hono/routes/resource.routes';
import { userRoutes } from '@/hono/routes/user.routes';
import { debugRoutes } from '@/utils/route-debugger';

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

  // Health check
  app.route('/', healthRoutes);

  // API routes
  app.route('/api/v1/auth', authRoutes);
  app.route('/api/v1', cartRoutes);
  app.route('/api/v1', resourceRoutes);
  app.route('/api/v1/group-orders', groupOrderRoutes);
  app.route('/api/v1/users', userRoutes);

  // The OpenAPI documentation is available at /doc (summary) and /openapi.json (full spec)
  // Note: Defined after all routes to ensure all schemas are registered
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
      },
    };

    return c.json(openAPIDocument);
  });

  app.get(
    '/docs',
    swaggerUI({
      url: '/openapi.json',
      config: {
        persistAuthorization: true, // Keep authorization token in browser storage
      },
    })
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
