/**
 * Main entry point - starts both Slack bot and Web API
 * @module index
 */

import config from './config';
import { logger } from './utils/logger';
import { startSlackBot } from './slack-bot';
import { startWebApi } from './web-api';

/**
 * Start all services
 */
async function main(): Promise<void> {
  logger.info('Starting Tacos Ordering API', {
    env: config.env,
    slackEnabled: config.slack.enabled,
    webApiEnabled: config.webApi.enabled,
  });

  try {
    const promises: Promise<void>[] = [];

    if (config.slack.enabled) {
      promises.push(startSlackBot());
    }

    if (config.webApi.enabled) {
      promises.push(startWebApi());
    }

    if (promises.length === 0) {
      logger.warn('No services enabled. Enable Slack or Web API in configuration.');
      return;
    }

    await Promise.all(promises);

    logger.info('✅ All services started successfully');
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
