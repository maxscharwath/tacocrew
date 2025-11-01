/**
 * Hono Application Setup
 * @module hono/app
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { debugRoutes } from '../utils/route-debugger';
import { errorHandler } from './middleware/error-handler';
import { cartRoutes } from './routes/cart.routes';
import { groupOrderRoutes } from './routes/group-order.routes';
import { healthRoutes } from './routes/health.routes';
import { resourceRoutes } from './routes/resource.routes';

/**
 * Hono route definitions for debugging
 */
const honoRoutes = [
  // Health routes
  { method: 'GET', path: '/health' },
  // Cart routes
  { method: 'POST', path: '/api/v1/carts' },
  { method: 'GET', path: '/api/v1/carts/:cartId' },
  { method: 'POST', path: '/api/v1/carts/:cartId/tacos' },
  { method: 'GET', path: '/api/v1/carts/:cartId/tacos/:id' },
  { method: 'PUT', path: '/api/v1/carts/:cartId/tacos/:id' },
  { method: 'PATCH', path: '/api/v1/carts/:cartId/tacos/:id/quantity' },
  { method: 'DELETE', path: '/api/v1/carts/:cartId/tacos/:id' },
  { method: 'POST', path: '/api/v1/carts/:cartId/extras' },
  { method: 'POST', path: '/api/v1/carts/:cartId/drinks' },
  { method: 'POST', path: '/api/v1/carts/:cartId/desserts' },
  { method: 'POST', path: '/api/v1/carts/:cartId/orders' },
  // Resource routes
  { method: 'GET', path: '/api/v1/resources/stock' },
];

/**
 * Create and configure Hono application
 */
export function createApp(): Hono {
  const app = new Hono();

  // Request logging
  app.use('*', logger());

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
  app.route('/api/v1', cartRoutes);
  app.route('/api/v1', resourceRoutes);
  app.route('/api/v1/group-orders', groupOrderRoutes);

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

  // Debug routes
  debugRoutes(honoRoutes, 'Hono');

  return app;
}
