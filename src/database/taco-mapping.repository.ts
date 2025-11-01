/**
 * Taco mapping repository for cart service
 * @module database/taco-mapping
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { inject } from '../utils/inject';
import { logger } from '../utils/logger';
import { PrismaService } from './prisma.service';

/**
 * Repository for managing taco UUID to backend index mappings
 */
@injectable()
export class TacoMappingRepository {
  private readonly prisma = inject(PrismaService);

  /**
   * Store UUID to backend index mapping
   */
  async store(cartId: string, backendIndex: number, tacoId: string): Promise<void> {
    try {
      await this.prisma.client.tacoMapping.upsert({
        where: {
          cartId_tacoId: {
            cartId,
            tacoId,
          },
        },
        create: {
          cartId,
          tacoId,
          backendIndex,
        },
        update: {
          backendIndex,
        },
      });
    } catch (error) {
      logger.error('Failed to store taco mapping', {
        cartId,
        tacoId,
        backendIndex,
        error,
      });
      throw error;
    }
  }

  /**
   * Get backend index from UUID
   */
  async getBackendIndex(cartId: string, tacoId: string): Promise<number | null> {
    try {
      const mapping = await this.prisma.client.tacoMapping.findUnique({
        where: {
          cartId_tacoId: {
            cartId,
            tacoId,
          },
        },
      });

      return mapping?.backendIndex ?? null;
    } catch (error) {
      logger.error('Failed to get taco mapping', { cartId, tacoId, error });
      return null;
    }
  }

  /**
   * Remove taco mapping
   */
  async remove(cartId: string, tacoId: string): Promise<void> {
    try {
      await this.prisma.client.tacoMapping.delete({
        where: {
          cartId_tacoId: {
            cartId,
            tacoId,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to remove taco mapping', { cartId, tacoId, error });
      // Don't throw if mapping doesn't exist
    }
  }

  /**
   * Remove all mappings for a cart
   */
  async removeAll(cartId: string): Promise<void> {
    try {
      await this.prisma.client.tacoMapping.deleteMany({
        where: { cartId },
      });
    } catch (error) {
      logger.error('Failed to remove all taco mappings', { cartId, error });
      throw error;
    }
  }

  /**
   * Get all mappings for a cart (index -> tacoId)
   */
  async getAllMappings(cartId: string): Promise<Map<number, string>> {
    try {
      const mappings = await this.prisma.client.tacoMapping.findMany({
        where: { cartId },
        orderBy: { backendIndex: 'asc' },
      });

      const mappingMap = new Map<number, string>();
      for (const mapping of mappings) {
        mappingMap.set(mapping.backendIndex, mapping.tacoId);
      }

      return mappingMap;
    } catch (error) {
      logger.error('Failed to get all taco mappings', { cartId, error });
      return new Map();
    }
  }
}
