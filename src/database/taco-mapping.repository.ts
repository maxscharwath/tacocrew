/**
 * Taco mapping repository for cart service
 * @module database/taco-mapping
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/database/prisma.service';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

/**
 * Repository for managing taco UUID to backend index mappings
 */
@injectable()
export class TacoMappingRepository {
  private readonly prisma = inject(PrismaService);

  /**
   * Store UUID to backend index mapping
   */
  async store(id: string, backendIndex: number, tacoId: string): Promise<void> {
    try {
      await this.prisma.client.tacoMapping.upsert({
        where: {
          cartId_tacoId: {
            cartId: id,
            tacoId,
          },
        },
        create: {
          cartId: id,
          tacoId,
          backendIndex,
        },
        update: {
          backendIndex,
        },
      });
    } catch (error) {
      logger.error('Failed to store taco mapping', {
        id,
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
  async getBackendIndex(id: string, tacoId: string): Promise<number | null> {
    try {
      const mapping = await this.prisma.client.tacoMapping.findUnique({
        where: {
          cartId_tacoId: {
            cartId: id,
            tacoId,
          },
        },
      });

      return mapping?.backendIndex ?? null;
    } catch (error) {
      logger.error('Failed to get taco mapping', { id, tacoId, error });
      return null;
    }
  }

  /**
   * Remove taco mapping
   */
  async remove(id: string, tacoId: string): Promise<void> {
    try {
      await this.prisma.client.tacoMapping.delete({
        where: {
          cartId_tacoId: {
            cartId: id,
            tacoId,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to remove taco mapping', { id, tacoId, error });
      // Don't throw if mapping doesn't exist
    }
  }

  /**
   * Remove all mappings for a cart
   */
  async removeAll(id: string): Promise<void> {
    try {
      await this.prisma.client.tacoMapping.deleteMany({
        where: { cartId: id },
      });
    } catch (error) {
      logger.error('Failed to remove all taco mappings', { id, error });
      throw error;
    }
  }

  /**
   * Get all mappings for a cart (index -> tacoId)
   */
  async getAllMappings(id: string): Promise<Map<number, string>> {
    try {
      const mappings = await this.prisma.client.tacoMapping.findMany({
        where: { cartId: id },
        orderBy: { backendIndex: 'asc' },
      });

      const mappingMap = new Map<number, string>();
      for (const mapping of mappings) {
        mappingMap.set(mapping.backendIndex, mapping.tacoId);
      }

      return mappingMap;
    } catch (error) {
      logger.error('Failed to get all taco mappings', { id, error });
      return new Map();
    }
  }
}
