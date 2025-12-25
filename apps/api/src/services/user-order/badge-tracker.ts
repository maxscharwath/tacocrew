/**
 * Badge tracker - handles stats tracking and badge evaluation
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import { TacoKind } from '@/schemas/taco.schema';
import type { UserId } from '@/schemas/user.schema';
import { BadgeEvaluationService } from '@/services/badge/badge-evaluation.service';
import { StatsTrackingService } from '@/services/badge/stats-tracking.service';
import type { UserOrderItems } from '@/shared/types/types';
import { OrderPriceCalculator } from './processors/price-calculator';

@injectable()
export class BadgeTracker {
  constructor(
    private readonly statsTrackingService: StatsTrackingService,
    private readonly badgeEvaluationService: BadgeEvaluationService
  ) {}

  async track(
    userId: UserId,
    items: UserOrderItems,
    _originallyMysteryTacoIds: Set<string> = new Set()
  ): Promise<void> {
    const totalCentimes = OrderPriceCalculator.calculateTotalCentimes(items);

    const tacoData = items.tacos.map((taco) => {
      // Check if this taco is a mystery taco (mystery tacos stay as mystery in DB)
      const isMystery = taco.kind === TacoKind.MYSTERY;

      return {
        isMystery,
        priceCentimes: taco.price,
        // Mystery tacos don't have ingredients, regular tacos do
        meats: isMystery ? [] : taco.meats.map((m) => m.code),
        sauces: isMystery ? [] : taco.sauces.map((s) => s.code),
        garnitures: isMystery ? [] : taco.garnitures.map((g) => g.code),
      };
    });

    await this.statsTrackingService.trackOrderCreated(userId, {
      tacos: tacoData,
      totalCentimes,
    });

    await this.badgeEvaluationService.evaluateAfterEvent(userId, {
      type: 'orderCreated',
      userId,
      timestamp: new Date(),
      data: {
        tacoCount: items.tacos.length,
        totalCentimes,
      },
    });

    const hasMysteryTaco = tacoData.some((t) => t.isMystery);
    if (hasMysteryTaco) {
      await this.badgeEvaluationService.evaluateAfterEvent(userId, {
        type: 'mysteryTacoOrdered',
        userId,
        timestamp: new Date(),
      });
    }
  }
}
