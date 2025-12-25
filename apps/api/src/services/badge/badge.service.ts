/**
 * Badge service - Main API-facing service for badges
 * @module services/badge/badge
 *
 * Simplified: uses metrics.config.ts for all metric lookups
 */

import { injectable } from 'tsyringe';
import { getMetricValue } from '@/config/metrics.config';
import { BadgeRepository } from '@/infrastructure/repositories/badge.repository';
import { UserStatsRepository } from '@/infrastructure/repositories/user-stats.repository';
import {
  type BadgeDefinition,
  type BadgeProgress,
  type EarnedBadgeResponse,
  parseBadgeContext,
} from '@/schemas/badge.schema';
import type { UserId } from '@/schemas/user.schema';
import { getAllBadges, getBadgeById, getVisibleBadges } from '@/services/badge/badge.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

export interface BadgeStats {
  readonly total: number;
  readonly earned: number;
  /** Earned badge IDs - FE uses this to compute byTier/byCategory */
  readonly earnedIds: string[];
}

@injectable()
export class BadgeService {
  private readonly badgeRepository = inject(BadgeRepository);
  private readonly statsRepository = inject(UserStatsRepository);

  /**
   * Get all badge definitions (visible only, secrets hidden)
   */
  getAllBadges(): BadgeDefinition[] {
    return getVisibleBadges();
  }

  /**
   * Get all badge definitions including secrets (for admin)
   */
  getAllBadgesIncludingSecrets(): readonly BadgeDefinition[] {
    return getAllBadges();
  }

  /**
   * Get a badge definition by ID
   */
  getBadgeById(id: string): BadgeDefinition | undefined {
    return getBadgeById(id);
  }

  /**
   * Get user's earned badges (just IDs, FE has definitions)
   */
  async getUserBadges(userId: UserId): Promise<EarnedBadgeResponse[]> {
    try {
      const userBadges = await this.badgeRepository.findByUserId(userId);

      return userBadges.map((ub) => ({
        badgeId: ub.badgeId,
        earnedAt: ub.earnedAt,
        context: parseBadgeContext(ub.context),
      }));
    } catch (error) {
      logger.error('Failed to get user badges', { userId, error });
      return [];
    }
  }

  /**
   * Get user's badge statistics (FE computes byTier/byCategory from its config)
   */
  async getUserBadgeStats(userId: UserId): Promise<BadgeStats> {
    try {
      const userBadges = await this.badgeRepository.findByUserId(userId);
      const allBadges = getVisibleBadges();

      return {
        total: allBadges.length,
        earned: userBadges.length,
        earnedIds: userBadges.map((ub) => ub.badgeId),
      };
    } catch (error) {
      logger.error('Failed to get user badge stats', { userId, error });
      return { total: 0, earned: 0, earnedIds: [] };
    }
  }

  /**
   * Get progress toward unearned badges
   * Uses centralized getMetricValue from metrics.config.ts
   */
  async getUserBadgeProgress(userId: UserId): Promise<BadgeProgress[]> {
    try {
      const [stats, earnedBadgeIds] = await Promise.all([
        this.statsRepository.getOrCreate(userId),
        this.badgeRepository.getEarnedBadgeIds(userId),
      ]);

      const visibleBadges = getVisibleBadges();
      const progress: BadgeProgress[] = [];

      for (const badge of visibleBadges) {
        // Skip earned badges
        if (earnedBadgeIds.has(badge.id)) continue;

        // Only show progress for count-based triggers
        if (badge.trigger.type !== 'count') continue;

        const current = getMetricValue(badge.trigger.metric, stats);
        const target = badge.trigger.threshold;
        const percentage = Math.min(100, Math.round((current / target) * 100));

        // Only include badges with some progress
        if (current > 0) {
          progress.push({
            badgeId: badge.id,
            current,
            target,
            percentage,
          });
        }
      }

      // Sort by percentage descending (closest to completion first)
      return progress.sort((a, b) => b.percentage - a.percentage);
    } catch (error) {
      logger.error('Failed to get user badge progress', { userId, error });
      return [];
    }
  }

  /**
   * Check if user has a specific badge
   */
  async userHasBadge(userId: UserId, badgeId: string): Promise<boolean> {
    return this.badgeRepository.exists(userId, badgeId);
  }
}
