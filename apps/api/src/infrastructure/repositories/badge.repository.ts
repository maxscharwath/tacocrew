/**
 * Badge repository - UserBadge CRUD operations
 * @module infrastructure/repositories/badge
 */

import { injectable } from 'tsyringe';
import type { UserBadge } from '@/generated/client';
import { Prisma } from '@/generated/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { UserId } from '@/schemas/user.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

export interface CreateBadgeData {
  readonly userId: UserId;
  readonly badgeId: string;
  readonly context?: {
    readonly orderId?: string;
    readonly groupOrderId?: string;
    readonly value?: number;
  };
}

@injectable()
export class BadgeRepository {
  private readonly prisma = inject(PrismaService);

  /**
   * Award a badge to a user
   */
  async create(data: CreateBadgeData): Promise<UserBadge> {
    try {
      const badge = await this.prisma.client.userBadge.create({
        data: {
          userId: data.userId,
          badgeId: data.badgeId,
          context: data.context ?? Prisma.JsonNull,
        },
      });
      logger.info('Badge awarded', { userId: data.userId, badgeId: data.badgeId });
      return badge;
    } catch (error) {
      // Handle unique constraint violation (badge already awarded)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        logger.debug('Badge already awarded', { userId: data.userId, badgeId: data.badgeId });
        const existing = await this.findByUserAndBadge(data.userId, data.badgeId);
        if (existing) return existing;
      }
      logger.error('Failed to award badge', { userId: data.userId, badgeId: data.badgeId, error });
      throw error;
    }
  }

  /**
   * Find all badges for a user
   */
  async findByUserId(userId: UserId): Promise<UserBadge[]> {
    try {
      return await this.prisma.client.userBadge.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find badges for user', { userId, error });
      return [];
    }
  }

  /**
   * Find a specific badge for a user
   */
  async findByUserAndBadge(userId: UserId, badgeId: string): Promise<UserBadge | null> {
    try {
      return await this.prisma.client.userBadge.findUnique({
        where: {
          userId_badgeId: { userId, badgeId },
        },
      });
    } catch (error) {
      logger.error('Failed to find badge', { userId, badgeId, error });
      return null;
    }
  }

  /**
   * Check if user has a specific badge
   */
  async exists(userId: UserId, badgeId: string): Promise<boolean> {
    try {
      const count = await this.prisma.client.userBadge.count({
        where: { userId, badgeId },
      });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check badge existence', { userId, badgeId, error });
      return false;
    }
  }

  /**
   * Get set of earned badge IDs for a user (for efficient checking)
   */
  async getEarnedBadgeIds(userId: UserId): Promise<Set<string>> {
    try {
      const badges = await this.prisma.client.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      });
      return new Set(badges.map((b) => b.badgeId));
    } catch (error) {
      logger.error('Failed to get earned badge IDs', { userId, error });
      return new Set();
    }
  }

  /**
   * Count total badges for a user
   */
  async countByUserId(userId: UserId): Promise<number> {
    try {
      return await this.prisma.client.userBadge.count({
        where: { userId },
      });
    } catch (error) {
      logger.error('Failed to count badges', { userId, error });
      return 0;
    }
  }

  /**
   * Delete all badges for a user (for testing/cleanup)
   */
  async deleteByUserId(userId: UserId): Promise<number> {
    try {
      const result = await this.prisma.client.userBadge.deleteMany({
        where: { userId },
      });
      logger.debug('Deleted badges for user', { userId, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete badges for user', { userId, error });
      return 0;
    }
  }
}
