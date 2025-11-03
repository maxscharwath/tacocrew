/**
 * Main entry point - starts Hono API
 * @module index
 */

import 'reflect-metadata';
import { config } from '@/config';
import { startHonoApi } from '@/hono-api';
import { killPort } from '@/utils/kill-port';
import { logger } from '@/utils/logger';

/**
 * Start all services
 */
async function main(): Promise<void> {
  logger.info('Starting Tacos Ordering API', {
    env: config.env,
    webApiEnabled: config.webApi.enabled,
  });

  try {
    if (config.webApi.enabled) {
      killPort(config.webApi.port);
      await startHonoApi();
      logger.info('✅ Hono API started successfully');
    } else {
      logger.warn('Web API is disabled in configuration.');
    }
  } catch (error) {
    logger.error('Failed to start services', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the application
// In ESM, always run main() when this module is imported directly
main().catch((error: Error) => {
  logger.error('Fatal error', { error: error.message, stack: error.stack });
  process.exit(1);
});

export default main;
