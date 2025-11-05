/**
 * Hono Web API Server
 * @module common/app/hono-api
 */

import { serve } from '@hono/node-server';
import { createApp } from '@/api/app/hono-app.config';
import { config } from '@/shared/config/app.config';
import { logger } from '@/shared/utils/logger.utils';

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
