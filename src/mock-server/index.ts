/**
 * Mock backend server entry point
 * @module mock-server
 */

import { logger } from '@/shared/utils/logger.utils';
import { MockBackendServer } from './mock-backend.server';

const server = new MockBackendServer(3001);

server
  .start()
  .then(() => {
    logger.info(`Mock backend server running at ${server.getUrl()}`);
    logger.info('Press Ctrl+C to stop');
  })
  .catch((error) => {
    logger.error('Failed to start mock server', { error });
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\nShutting down mock server...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\nShutting down mock server...');
  await server.stop();
  process.exit(0);
});
