import 'reflect-metadata';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { wrapBetterAuthErrors } from './api/middleware/better-auth-error-wrapper.middleware';
import { errorHandler } from './api/middleware/error-handler.middleware';
import { groupOrderRoutes, publicGroupOrderRoutes } from './api/routes/group-order.routes';
import { healthRoutes } from './api/routes/health.routes';
import { resourceRoutes } from './api/routes/resource.routes';
import { tacoRoutes } from './api/routes/taco.routes';
import { userRoutes } from './api/routes/user.routes';
import { userOrderRoutes } from './api/routes/user-order.routes';
import { createRouteGroup } from './api/utils/route.utils';
import { auth } from './auth';
import { config } from './shared/config/app.config';
import { logger } from './shared/utils/logger.utils';
import { debugRoutes } from './shared/utils/route-debugger.utils';

const app = new OpenAPIHono();

// Request logging
app.use('*', honoLogger());

// CORS - Must use specific origin when credentials are enabled
// Better Auth uses cookies (credentials), so we can't use wildcard '*'
// In development, default to Vite dev server
const defaultOrigin = 'http://localhost:5173';

app.use(
  '*',
  cors({
    origin: (origin) => {
      // In development, allow any localhost origin
      if (config.isDevelopment) {
        if (!origin) {
          return defaultOrigin;
        }
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return origin;
        }
      }

      // Check configured origin (corsOrigin is always a string from config)
      const corsOrigin =
        config.webApi.corsOrigin === '*' ? defaultOrigin : config.webApi.corsOrigin;
      return origin === corsOrigin ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-username', 'Cookie'],
    exposeHeaders: ['Set-Cookie'],
    credentials: true,
  })
);

// Better Auth session middleware - stores user/session in context globally
// This follows the recommended Better Auth + Hono integration pattern
app.use('*', async (c, next) => {
  // Pass the raw Request object to Better Auth so it can read cookies
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set('user', session?.user || null);
  c.set('session', session?.session || null);
  await next();
});

// Better Auth handler - mount before other routes
// Handle all HTTP methods for Better Auth (including OPTIONS for CORS, PUT/DELETE for passkey management, etc.)
// The wrapBetterAuthErrors middleware transforms Better Auth errors to include i18n keys
app.on(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], '/api/auth/*', async (c) => {
  return await wrapBetterAuthErrors(c, (req) => auth.handler(req));
});

// The OpenAPI documentation is available at /docs (summary) and /openapi.json (full spec)
// Note: Defined BEFORE routes to ensure they're not affected by route-level auth middleware
app.get('/openapi.json', (c) => {
  const openAPIDocument = app.getOpenAPI31Document({
    openapi: '3.1.0',
    info: {
      title: 'TacoCrew API',
      version: '1.0.0',
      description: 'API documentation for TacoCrew group ordering system',
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
  })
);

// API routes (registered after docs to ensure docs are accessible)
// Health route is at /api prefix for Vercel deployment
// Vercel routes /api/* to this serverless function, so we need /api prefix
app.route('/api', healthRoutes);

// Public API routes (no authentication required) - register FIRST so they match before authenticated routes
app.route('/api/v1', publicGroupOrderRoutes);
app.route('/api/v1', tacoRoutes);

// v1 API routes (authenticated) - register AFTER public routes
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

// Start server in development
if (process.env['NODE_ENV'] !== 'production') {
  const { serve } = await import('@hono/node-server');
  const port = Number(process.env['WEB_API_PORT']) || 4000;

  serve({
    fetch: app.fetch,
    port,
  });

  logger.info(`🚀 Server running on http://localhost:${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/docs`);
}

// Export with Hono type to ensure Vercel detects this as a Hono app
// The Hono reference must be preserved in the bundle for framework detection
export { Hono } from 'hono';
export default app;
