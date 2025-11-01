/**
 * Main entry point - starts Hono API
 * @module index
 */

import config from './config';
import { logger } from './utils/logger';
import { startHonoApi } from './hono-api';

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
if (require.main === module) {
  main().catch((error: Error) => {
    logger.error('Fatal error', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

export default main;
