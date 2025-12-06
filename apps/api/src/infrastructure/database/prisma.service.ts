/**
 * Prisma database service
 * @module database/prisma
 */

import { injectable } from 'tsyringe';
import { PrismaClient } from '@/generated/client';
import { getPrismaClient } from '@/infrastructure/database/prisma.client';
import { logger } from '@/shared/utils/logger.utils';

/**
 * Prisma service wrapper for dependency injection
 * Uses the shared PrismaClient instance to avoid connection pool exhaustion
 */
@injectable()
export class PrismaService {
  public readonly client: PrismaClient;

  constructor() {
    // Use the shared PrismaClient instance
    this.client = getPrismaClient();
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
