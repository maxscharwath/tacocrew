/**
 * Resource routes for Hono
 * @module hono/routes/resource
 */

import 'reflect-metadata';
import { Hono } from 'hono';
import { ResourceService } from '../../services/resource.service';
import { inject } from '../../utils/inject';

const app = new Hono();

/**
 * Get stock availability
 */
app.get('/resources/stock', async (c) => {
  const resourceService = inject(ResourceService);
  const stock = await resourceService.getStock();

  return c.json(stock);
});

export const resourceRoutes = app;
