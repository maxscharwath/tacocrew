/**
 * Health check routes for Hono
 * @module hono/routes/health
 */

import { Hono } from 'hono';

const app = new Hono();

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export const healthRoutes = app;
