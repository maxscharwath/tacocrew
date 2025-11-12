/**
 * Shared PrismaClient instance
 * This ensures we only have one PrismaClient instance across the entire application
 * to avoid connection pool exhaustion
 * @module infrastructure/database/prisma.client
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger.utils';

// Singleton pattern to ensure only one PrismaClient instance exists
let prismaClient: PrismaClient | null = null;

/**
 * Get or create the shared PrismaClient instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    const logConfig = [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ] satisfies Prisma.LogDefinition[];

    prismaClient = new PrismaClient({ log: logConfig }) as PrismaClient<
      Prisma.PrismaClientOptions,
      'query' | 'error' | 'warn'
    >;

    // Log queries in development
    const onEvent = prismaClient.$on.bind(prismaClient) as unknown as <
      T extends 'query' | 'error' | 'warn',
    >(
      eventType: T,
      callback: (event: Prisma.QueryEvent | Prisma.LogEvent) => void
    ) => void;

    if (process.env['NODE_ENV'] === 'development') {
      onEvent('query', (e) => {
        const event = e as Prisma.QueryEvent;
        logger.debug('Prisma Query', {
          query: event.query,
          duration: `${event.duration}ms`,
        });
      });
    }

    onEvent('error', (e) => {
      const event = e as Prisma.LogEvent;
      logger.error('Prisma Error', { message: event.message });
    });

    onEvent('warn', (e) => {
      const event = e as Prisma.LogEvent;
      logger.warn('Prisma Warning', { message: event.message });
    });
  }

  return prismaClient;
}
