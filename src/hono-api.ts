/**
 * Hono Web API Server
 * @module hono-api
 */

import { serve } from '@hono/node-server';
import { config } from '@/config';
import { createApp } from '@/hono/app';
import { logger } from '@/utils/logger';

/**
 * Start the Hono web API server
 */
export function startHonoApi(): void {
  if (!config.webApi.enabled) {
    logger.warn('Web API is disabled in configuration');
    return;
  }

  logger.info('Initializing Hono Web API');

  // Create Hono app
  const app = createApp();

  // Start server
  serve(
    {
      fetch: app.fetch,
      port: config.webApi.port,
    },
    (info) => {
      logger.info('🚀 Hono Web API server is running!', {
        port: info.port,
        env: config.env,
      });
    }
  );
}
