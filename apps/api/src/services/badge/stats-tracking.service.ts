/**
 * Stats tracking service - Updates user statistics on events
 * @module services/badge/stats-tracking
 */

import { injectable } from 'tsyringe';
import { UserStatsRepository } from '@/infrastructure/repositories/user-stats.repository';
import type { UserId } from '@/schemas/user.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

export interface TacoOrderData {
  readonly isMystery: boolean;
  readonly priceCentimes: number;
  readonly meats: readonly string[];
  readonly sauces: readonly string[];
  readonly garnitures: readonly string[];
}

export interface OrderCreatedData {
  readonly tacos: readonly TacoOrderData[];
  readonly totalCentimes: number;
}

@injectable()
export class StatsTrackingService {
  private readonly statsRepository = inject(UserStatsRepository);

  /**
   * Track when a user creates/updates an order
   */
  async trackOrderCreated(userId: UserId, data: OrderCreatedData): Promise<void> {
    try {
      const tacoCount = data.tacos.length;
      const mysteryCount = data.tacos.filter((t) => t.isMystery).length;

      // Collect all unique ingredients
      const allMeats = new Set<string>();
      const allSauces = new Set<string>();
      const allGarnitures = new Set<string>();

      for (const taco of data.tacos) {
        for (const meat of taco.meats) allMeats.add(meat);
        for (const sauce of taco.sauces) allSauces.add(sauce);
        for (const garniture of taco.garnitures) allGarnitures.add(garniture);
      }

      // Increment counters
      await this.statsRepository.increment(userId, {
        tacosOrdered: tacoCount,
        mysteryTacosOrdered: mysteryCount,
        ordersPlaced: 1,
        totalSpentCentimes: data.totalCentimes,
      });

      // Track unique ingredients tried
      if (allMeats.size > 0) {
        await this.statsRepository.addToArray(userId, 'meatsTried', Array.from(allMeats));
      }
      if (allSauces.size > 0) {
        await this.statsRepository.addToArray(userId, 'saucesTried', Array.from(allSauces));
      }
      if (allGarnitures.size > 0) {
        await this.statsRepository.addToArray(userId, 'garnituresTried', Array.from(allGarnitures));
      }

      // Update streak
      await this.statsRepository.updateStreak(userId);

      logger.debug('Stats tracked for order', {
        userId,
        tacoCount,
        mysteryCount,
        meats: allMeats.size,
        sauces: allSauces.size,
      });
    } catch (error) {
      logger.error('Failed to track order stats', { userId, error });
      // Don't throw - stats tracking should not block order creation
    }
  }

  /**
   * Track when a user creates a group order
   */
  async trackGroupOrderCreated(userId: UserId): Promise<void> {
    try {
      await this.statsRepository.increment(userId, { groupOrdersCreated: 1 });
      logger.debug('Stats tracked for group order creation', { userId });
    } catch (error) {
      logger.error('Failed to track group order creation', { userId, error });
    }
  }

  /**
   * Track when a user leads (submits) a group order
   */
  async trackGroupOrderLed(userId: UserId): Promise<void> {
    try {
      await this.statsRepository.increment(userId, { groupOrdersLed: 1 });
      logger.debug('Stats tracked for group order led', { userId });
    } catch (error) {
      logger.error('Failed to track group order led', { userId, error });
    }
  }

  /**
   * Track when a user joins an organization
   */
  async trackOrganizationJoined(userId: UserId): Promise<void> {
    try {
      await this.statsRepository.increment(userId, { organizationsJoined: 1 });
      logger.debug('Stats tracked for organization joined', { userId });
    } catch (error) {
      logger.error('Failed to track organization joined', { userId, error });
    }
  }

  /**
   * Track when a user creates an organization
   */
  async trackOrganizationCreated(userId: UserId): Promise<void> {
    try {
      await this.statsRepository.increment(userId, { organizationsCreated: 1 });
      logger.debug('Stats tracked for organization created', { userId });
    } catch (error) {
      logger.error('Failed to track organization created', { userId, error });
    }
  }

  /**
   * Track when a user invites a member
   */
  async trackMemberInvited(userId: UserId): Promise<void> {
    try {
      await this.statsRepository.increment(userId, { membersInvited: 1 });
      logger.debug('Stats tracked for member invited', { userId });
    } catch (error) {
      logger.error('Failed to track member invited', { userId, error });
    }
  }

  /**
   * Track when a user pays for someone else
   */
  async trackPaidForOther(userId: UserId): Promise<void> {
    try {
      await this.statsRepository.increment(userId, { timesPaidForOthers: 1 });
      logger.debug('Stats tracked for paid for other', { userId });
    } catch (error) {
      logger.error('Failed to track paid for other', { userId, error });
    }
  }

  /**
   * Track when a user gets reimbursed
   */
  async trackGotReimbursed(userId: UserId): Promise<void> {
    try {
      await this.statsRepository.increment(userId, { timesGotReimbursed: 1 });
      logger.debug('Stats tracked for got reimbursed', { userId });
    } catch (error) {
      logger.error('Failed to track got reimbursed', { userId, error });
    }
  }
}
