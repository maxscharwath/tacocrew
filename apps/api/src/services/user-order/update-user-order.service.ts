/**
 * Update user order use case
 *
 * Updates a UserOrder's items **in place**, never mutating `userId`. This is
 * what powers the "edit" flow: the requester (owner OR group leader) replaces
 * the cart contents, but the order keeps belonging to the original participant.
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { canGroupOrderBeModified, isGroupOrderLeader } from '@/schemas/group-order.schema';
import { UserId } from '@/schemas/user.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { BadgeEvaluationService } from '@/services/badge/badge-evaluation.service';
import { StatsTrackingService } from '@/services/badge/stats-tracking.service';
import { ResourceService } from '@/services/resource/resource.service';
import type { StockAvailability, UserOrderItems } from '@/shared/types/types';
import { ForbiddenError, NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import {
  sortUserOrderIngredients,
  validateItemAvailability,
} from '@/shared/utils/order-validation.utils';
import { BadgeTracker } from './badge-tracker';
import { IdAssigner } from './processors/id-assigner';
import { ItemEnricher } from './processors/item-enricher';
import { TacoIdHexGenerator } from './processors/taco-id-hex-generator';

@injectable()
export class UpdateUserOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly resourceService = inject(ResourceService);
  private readonly badgeTracker = new BadgeTracker(
    inject(StatsTrackingService),
    inject(BadgeEvaluationService)
  );

  async execute(
    orderId: string,
    requesterId: UserId,
    request: CreateUserOrderRequestDto
  ): Promise<UserOrder> {
    const existing = await this.userOrderRepository.findById(orderId);
    if (!existing) {
      throw new NotFoundError({ resource: 'UserOrder', id: orderId });
    }

    const groupOrder = await this.groupOrderRepository.findById(existing.groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: existing.groupOrderId });
    }

    const ownerId = UserId.parse(existing.userId);
    const isOwner = ownerId === requesterId;
    const isLeader = isGroupOrderLeader(groupOrder, requesterId);
    if (!isOwner && !isLeader) {
      throw new ForbiddenError();
    }

    if (!canGroupOrderBeModified(groupOrder)) {
      throw new ValidationError({
        message: `Cannot modify user order. Group order status: ${groupOrder.status}`,
      });
    }

    const stock = await this.resourceService.getStockForProcessing();
    const processedItems = this.processItems(request.items, stock);
    const { originallyMysteryTacoIds, ...items } = processedItems;

    const updated = await this.userOrderRepository.update(orderId, { items });

    logger.info('User order updated', {
      orderId,
      groupOrderId: existing.groupOrderId,
      ownerId,
      editedBy: requesterId,
      editedByLeader: !isOwner && isLeader,
      itemCounts: {
        tacos: items.tacos.length,
        extras: items.extras.length,
        drinks: items.drinks.length,
        desserts: items.desserts.length,
      },
    });

    // Track badges for the ORIGINAL owner — they own this order, not the editor.
    this.badgeTracker.track(ownerId, items, originallyMysteryTacoIds).catch((error) => {
      logger.error('Failed to track order update for badges', { ownerId, error });
    });

    return updated;
  }

  private processItems(
    simpleItems: CreateUserOrderRequestDto['items'],
    stock: StockAvailability
  ): UserOrderItems & { originallyMysteryTacoIds: Set<string> } {
    const enriched = ItemEnricher.enrich(simpleItems, stock);
    const { originallyMysteryTacoIds, ...items } = enriched;
    const withIds = IdAssigner.assign(items);
    const sorted = sortUserOrderIngredients(withIds);
    validateItemAvailability(sorted, stock);
    const finalItems = TacoIdHexGenerator.generate(sorted);
    return { ...finalItems, originallyMysteryTacoIds };
  }
}
