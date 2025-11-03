/**
 * Prisma database service
 * @module database/prisma
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';
import { logger } from '@/utils/logger';

/**
 * Prisma service wrapper for dependency injection
 */
@injectable()
export class PrismaService {
  public readonly client: PrismaClient;

  constructor() {
    const logConfig = [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ] satisfies Prisma.LogDefinition[];

    this.client = new PrismaClient({ log: logConfig }) as PrismaClient<
      Prisma.PrismaClientOptions,
      'query' | 'error' | 'warn'
    >;

    // Log queries in development
    const onEvent = this.client.$on.bind(this.client) as unknown as <
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

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    await this.client.$connect();
    logger.info('Database connected');
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.client.$disconnect();
    logger.info('Database disconnected');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
