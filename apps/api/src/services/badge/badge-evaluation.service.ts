/**
 * Badge evaluation service - Evaluates and awards badges
 * @module services/badge/badge-evaluation
 *
 * This service is now simplified:
 * - Uses metrics.config.ts for metric definitions
 * - Auto-derives which badges to check from badge triggers
 * - No manual EVENT_TO_TRIGGERS mapping needed!
 */

import { injectable } from 'tsyringe';
import type { UserBadge } from '@/generated/client';
import { getMetricsForEvent } from '@/config/metrics.config';
import { BadgeRepository } from '@/infrastructure/repositories/badge.repository';
import { UserStatsRepository } from '@/infrastructure/repositories/user-stats.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import type { BadgeDefinition, BadgeEvent, BadgeEventType } from '@/schemas/badge.schema';
import type { UserId } from '@/schemas/user.schema';
import { getAllBadges, getAvailableBadges } from '@/services/badge/badge.utils';
import { evaluateTrigger, getEventForAction } from '@/services/badge/trigger-evaluator';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

@injectable()
export class BadgeEvaluationService {
  private readonly badgeRepository = inject(BadgeRepository);
  private readonly statsRepository = inject(UserStatsRepository);
  private readonly userRepository = inject(UserRepository);

  /**
   * Evaluate all applicable badges after an event
   * Returns newly awarded badges
   */
  async evaluateAfterEvent(userId: UserId, event: BadgeEvent): Promise<UserBadge[]> {
    try {
      // Get user stats and earned badges in parallel
      const [stats, earnedBadgeIds, user] = await Promise.all([
        this.statsRepository.getOrCreate(userId),
        this.badgeRepository.getEarnedBadgeIds(userId),
        this.userRepository.findById(userId),
      ]);

      if (!user) {
        logger.warn('User not found for badge evaluation', { userId });
        return [];
      }

      const userCreatedAt = user.createdAt ?? new Date();
      const now = new Date();

      // Get badges that are currently available and relevant to this event
      const availableBadges = getAvailableBadges(now);
      const applicableBadges = this.getApplicableBadges(availableBadges, event.type);

      const newBadges: UserBadge[] = [];

      for (const badge of applicableBadges) {
        // Skip if already earned
        if (earnedBadgeIds.has(badge.id)) continue;

        // Evaluate trigger
        const passed = evaluateTrigger(badge.trigger, {
          stats,
          event,
          userCreatedAt,
        });

        if (passed) {
          const userBadge = await this.awardBadge(userId, badge, event);
          if (userBadge) {
            newBadges.push(userBadge);
          }
        }
      }

      if (newBadges.length > 0) {
        logger.info('Badges awarded', {
          userId,
          badgeIds: newBadges.map((b) => b.badgeId),
          eventType: event.type,
        });
      }

      return newBadges;
    } catch (error) {
      logger.error('Failed to evaluate badges', { userId, eventType: event.type, error });
      return [];
    }
  }

  /**
   * Award a badge to a user
   */
  private async awardBadge(userId: UserId, badge: BadgeDefinition, event: BadgeEvent): Promise<UserBadge | null> {
    try {
      return await this.badgeRepository.create({
        userId,
        badgeId: badge.id,
        context: extractBadgeContext(event.data),
      });
    } catch (error) {
      logger.error('Failed to award badge', { userId, badgeId: badge.id, error });
      return null;
    }
  }

  /**
   * Get badges that are relevant to a specific event type
   * Auto-derived from badge triggers - no manual mapping needed!
   */
  private getApplicableBadges(badges: BadgeDefinition[], eventType: BadgeEventType): BadgeDefinition[] {
    // Get metrics that this event can affect
    const affectedMetrics = new Set(getMetricsForEvent(eventType).map((m) => m.id));

    return badges.filter((badge) => this.isBadgeRelevantToEvent(badge.trigger, eventType, affectedMetrics));
  }

  /**
   * Check if a badge trigger is relevant to an event
   */
  private isBadgeRelevantToEvent(
    trigger: BadgeDefinition['trigger'],
    eventType: BadgeEventType,
    affectedMetrics: Set<string>
  ): boolean {
    switch (trigger.type) {
      case 'count':
        // Relevant if the event affects this metric
        return affectedMetrics.has(trigger.metric);

      case 'action':
        // Relevant if the action is triggered by this event
        return getEventForAction(trigger.action) === eventType;

      case 'streak':
        // Streaks are updated on orderCreated
        return eventType === 'orderCreated';

      case 'date':
      case 'time':
        // Date/time triggers can happen on any order event
        return eventType === 'orderCreated';

      case 'role':
        // Role triggers are relevant for leadership/org events
        return ['groupOrderSubmitted', 'organizationCreated'].includes(eventType);

      case 'combo':
        // Combo is relevant if any sub-condition is relevant
        return trigger.conditions.some((c) => this.isBadgeRelevantToEvent(c, eventType, affectedMetrics));

      default:
        return false;
    }
  }

  /**
   * Evaluate all badges for a user (for backfill/initial check)
   * This is more expensive - evaluates every badge
   */
  async evaluateAllBadges(userId: UserId): Promise<UserBadge[]> {
    try {
      const [stats, earnedBadgeIds, user] = await Promise.all([
        this.statsRepository.getOrCreate(userId),
        this.badgeRepository.getEarnedBadgeIds(userId),
        this.userRepository.findById(userId),
      ]);

      if (!user) {
        logger.warn('User not found for full badge evaluation', { userId });
        return [];
      }

      const now = new Date();
      const allBadges = getAllBadges();
      const newBadges: UserBadge[] = [];

      // Create a synthetic event for evaluation
      const syntheticEvent: BadgeEvent = {
        type: 'orderCreated',
        userId,
        timestamp: now,
      };

      const userCreatedAt = user.createdAt ?? new Date();

      for (const badge of allBadges) {
        // Skip if already earned
        if (earnedBadgeIds.has(badge.id)) continue;

        // Check badge availability based on when the user registered (for backfill)
        // Badge is expired if user registered AFTER the until date
        if (badge.availability) {
          const { from, until } = badge.availability;
          if (from && userCreatedAt < from) continue;
          if (until && userCreatedAt > until) continue;
        }

        // Evaluate trigger (count, combo, streak, and date triggers make sense for backfill)
        if (
          badge.trigger.type === 'count' ||
          badge.trigger.type === 'combo' ||
          badge.trigger.type === 'streak' ||
          badge.trigger.type === 'date'
        ) {
          const passed = evaluateTrigger(badge.trigger, {
            stats,
            event: syntheticEvent,
            userCreatedAt: user.createdAt ?? new Date(),
          });

          if (passed) {
            const userBadge = await this.awardBadge(userId, badge, syntheticEvent);
            if (userBadge) {
              newBadges.push(userBadge);
            }
          }
        }
      }

      if (newBadges.length > 0) {
        logger.info('Badges awarded via full evaluation', {
          userId,
          badgeIds: newBadges.map((b) => b.badgeId),
        });
      }

      return newBadges;
    } catch (error) {
      logger.error('Failed to evaluate all badges', { userId, error });
      return [];
    }
  }
}

/**
 * Extract badge context from event data (type-safe)
 */
function extractBadgeContext(
  data: Record<string, unknown> | undefined
): { orderId?: string; groupOrderId?: string; value?: number } | undefined {
  if (!data) return undefined;

  const context: { orderId?: string; groupOrderId?: string; value?: number } = {};

  if (typeof data['orderId'] === 'string') {
    context.orderId = data['orderId'];
  }
  if (typeof data['groupOrderId'] === 'string') {
    context.groupOrderId = data['groupOrderId'];
  }
  if (typeof data['value'] === 'number') {
    context.value = data['value'];
  }

  return Object.keys(context).length > 0 ? context : undefined;
}
