/**
 * Prisma database service
 * @module database/prisma
 */

import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';
import { logger } from '../utils/logger';

/**
 * Prisma service wrapper for dependency injection
 */
@injectable()
export class PrismaService {
  public readonly client: PrismaClient;

  constructor() {
    this.client = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Log queries in development
    if (process.env['NODE_ENV'] === 'development') {
      this.client.$on('query', (e: { query: string; duration: number }) => {
        logger.debug('Prisma Query', {
          query: e.query,
          duration: `${e.duration}ms`,
        });
      });
    }

    this.client.$on('error', (e: { message: string }) => {
      logger.error('Prisma Error', { message: e.message });
    });

    this.client.$on('warn', (e: { message: string }) => {
      logger.warn('Prisma Warning', { message: e.message });
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
