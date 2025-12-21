/**
 * Shared PrismaClient instance
 * This ensures we only have one PrismaClient instance across the entire application
 * to avoid connection pool exhaustion
 * @module infrastructure/database/prisma.client
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { pagination } from 'prisma-extension-pagination';
import { Prisma, PrismaClient } from '@/generated/client';
import { logger } from '@/shared/utils/logger.utils';

// Type for PrismaClient with pagination extension
export type PrismaClientWithPagination = ReturnType<typeof createPrismaClient>;

// Singleton pattern to ensure only one PrismaClient instance exists
let prismaClient: PrismaClientWithPagination | null = null;

/**
 * Create a PrismaClient instance with pagination extension
 */
function createPrismaClient() {
  const logConfig = [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ] satisfies Prisma.LogDefinition[];

  // Prisma 7: Create adapter using @prisma/adapter-pg for PostgreSQL
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  const baseClient = new PrismaClient({
    log: logConfig,
    adapter,
  });

  // Extend with pagination extension
  const extendedClient = baseClient.$extends(
    pagination({
      cursor: {
        limit: 20, // Default limit
        getCursor(target: { id: string }) {
          return target.id;
        },
        parseCursor(cursor: string) {
          return { id: cursor };
        },
      },
    })
  );

  // Store base client reference for event logging
  (extendedClient as unknown as { _baseClient: PrismaClient })._baseClient = baseClient;

  return extendedClient;
}

/**
 * Get or create the shared PrismaClient instance with pagination extension
 */
export function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = createPrismaClient();

    // Log queries in development
    // Access $on from the base client since extensions may not expose it
    const baseClient = (prismaClient as unknown as { _baseClient: PrismaClient })._baseClient;
    const onEvent = baseClient.$on.bind(baseClient) as unknown as <
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
