/**
 * UserStats repository - User statistics CRUD operations
 * @module infrastructure/repositories/user-stats
 */

import { injectable } from 'tsyringe';
import type { UserStats } from '@/generated/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { UserId } from '@/schemas/user.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

/** Fields that can be incremented */
export type IncrementableField =
  | 'tacosOrdered'
  | 'mysteryTacosOrdered'
  | 'ordersPlaced'
  | 'totalSpentCentimes'
  | 'groupOrdersCreated'
  | 'groupOrdersLed'
  | 'organizationsJoined'
  | 'organizationsCreated'
  | 'membersInvited'
  | 'timesPaidForOthers'
  | 'timesGotReimbursed';

/** JSON array fields for exploration tracking */
export type ArrayField = 'meatsTried' | 'saucesTried' | 'garnituresTried';

@injectable()
export class UserStatsRepository {
  private readonly prisma = inject(PrismaService);

  /**
   * Get or create stats for a user
   */
  async getOrCreate(userId: UserId): Promise<UserStats> {
    try {
      const existing = await this.prisma.client.userStats.findUnique({
        where: { userId },
      });

      if (existing) return existing;

      return await this.prisma.client.userStats.create({
        data: { userId },
      });
    } catch (error) {
      logger.error('Failed to get or create user stats', { userId, error });
      throw error;
    }
  }

  /**
   * Get stats for a user (returns null if not found)
   */
  async findByUserId(userId: UserId): Promise<UserStats | null> {
    try {
      return await this.prisma.client.userStats.findUnique({
        where: { userId },
      });
    } catch (error) {
      logger.error('Failed to find user stats', { userId, error });
      return null;
    }
  }

  /**
   * Increment one or more counter fields
   */
  async increment(
    userId: UserId,
    fields: Partial<Record<IncrementableField, number>>
  ): Promise<UserStats> {
    try {
      // Ensure stats exist
      await this.getOrCreate(userId);

      return await this.prisma.client.userStats.update({
        where: { userId },
        data: fields,
      });
    } catch (error) {
      logger.error('Failed to increment user stats', { userId, fields, error });
      throw error;
    }
  }

  /**
   * Add unique items to a JSON array field
   * Handles both string IDs and objects with id field
   * Returns the updated count of unique items
   */
  async addToArray(userId: UserId, field: ArrayField, items: readonly string[]): Promise<number> {
    if (items.length === 0) return 0;

    try {
      const stats = await this.getOrCreate(userId);
      const currentItems = (stats[field] as unknown[]) || [];

      // Deduplicate by id field (for objects) or by value (for strings)
      const seen = new Set<string>();
      const unique: unknown[] = [];

      // First, add existing items
      for (const item of currentItems) {
        if (typeof item === 'string') {
          if (!seen.has(item)) {
            seen.add(item);
            unique.push(item);
          }
        } else if (
          item &&
          typeof item === 'object' &&
          'id' in item &&
          typeof item.id === 'string'
        ) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
          }
        }
      }

      // Then, add new items (only strings are passed in, but check for safety)
      for (const item of items) {
        if (typeof item === 'string' && !seen.has(item)) {
          seen.add(item);
          unique.push(item);
        }
      }

      await this.prisma.client.userStats.update({
        where: { userId },
        data: { [field]: unique },
      });

      return unique.length;
    } catch (error) {
      logger.error('Failed to add items to array', { userId, field, items, error });
      throw error;
    }
  }

  /**
   * Update order streak based on current week
   * Call this when a user places an order
   */
  async updateStreak(userId: UserId): Promise<{ current: number; longest: number }> {
    try {
      const stats = await this.getOrCreate(userId);
      const now = new Date();
      const currentWeek = getISOWeek(now);
      const currentYear = now.getFullYear();

      let newStreak = stats.currentOrderStreak;
      let longestStreak = stats.longestOrderStreak;

      if (stats.lastOrderWeek === null || stats.lastOrderYear === null) {
        // First order ever
        newStreak = 1;
      } else if (stats.lastOrderYear === currentYear && stats.lastOrderWeek === currentWeek) {
        // Already ordered this week, no change
      } else if (
        isConsecutiveWeek(stats.lastOrderYear, stats.lastOrderWeek, currentYear, currentWeek)
      ) {
        // Consecutive week, increment streak
        newStreak = stats.currentOrderStreak + 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }

      // Update longest streak if needed
      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }

      await this.prisma.client.userStats.update({
        where: { userId },
        data: {
          currentOrderStreak: newStreak,
          longestOrderStreak: longestStreak,
          lastOrderWeek: currentWeek,
          lastOrderYear: currentYear,
        },
      });

      return { current: newStreak, longest: longestStreak };
    } catch (error) {
      logger.error('Failed to update streak', { userId, error });
      throw error;
    }
  }

  /**
   * Delete stats for a user (for testing/cleanup)
   */
  async deleteByUserId(userId: UserId): Promise<boolean> {
    try {
      await this.prisma.client.userStats.delete({
        where: { userId },
      });
      return true;
    } catch (error) {
      logger.error('Failed to delete user stats', { userId, error });
      return false;
    }
  }
}

/**
 * Get ISO week number (1-53)
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Check if two year/week pairs are consecutive
 */
function isConsecutiveWeek(
  prevYear: number,
  prevWeek: number,
  currYear: number,
  currWeek: number
): boolean {
  if (currYear === prevYear) {
    return currWeek === prevWeek + 1;
  }
  // Handle year boundary (week 52/53 -> week 1)
  if (currYear === prevYear + 1 && currWeek === 1) {
    // Previous week should be 52 or 53
    return prevWeek >= 52;
  }
  return false;
}
