/**
 * Create user order use case
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { canGroupOrderBeModified, type GroupOrderId } from '@/schemas/group-order.schema';
import type { UserId } from '@/schemas/user.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { BadgeEvaluationService } from '@/services/badge/badge-evaluation.service';
import { StatsTrackingService } from '@/services/badge/stats-tracking.service';
import { ResourceService } from '@/services/resource/resource.service';
import { UserService } from '@/services/user/user.service';
import type { StockAvailability, UserOrderItems } from '@/shared/types/types';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { extractTacoIdsHex } from '@/shared/utils/order-taco-id.utils';
import {
  sortUserOrderIngredients,
  validateItemAvailability,
} from '@/shared/utils/order-validation.utils';
import { BadgeTracker } from './badge-tracker';
import { IdAssigner } from './processors/id-assigner';
import { ItemEnricher } from './processors/item-enricher';
import { TacoIdHexGenerator } from './processors/taco-id-hex-generator';

/**
 * Create or update user order use case
 */
@injectable()
export class CreateUserOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly resourceService = inject(ResourceService);
  private readonly userService = inject(UserService);
  private readonly badgeTracker = new BadgeTracker(
    inject(StatsTrackingService),
    inject(BadgeEvaluationService)
  );

  async execute(
    groupOrderId: GroupOrderId,
    userId: UserId,
    request: CreateUserOrderRequestDto
  ): Promise<UserOrder> {
    await this.validateUser(userId);
    await this.validateGroupOrder(groupOrderId);
    const stock = await this.resourceService.getStockForProcessing();

    const processedItems = this.processItems(request.items, stock);
    const { originallyMysteryTacoIds, ...items } = processedItems;
    const tacoIdsHex = extractTacoIdsHex(items);

    const userOrder = await this.userOrderRepository.create({
      groupOrderId,
      userId,
      items,
      tacoIdsHex: tacoIdsHex.length > 0 ? tacoIdsHex : null,
    });

    this.logOrderCreated(groupOrderId, userId, items);
    this.badgeTracker.track(userId, items, originallyMysteryTacoIds).catch((error) => {
      logger.error('Failed to track order for badges', { userId, error });
    });

    return userOrder;
  }

  private async validateUser(userId: UserId): Promise<void> {
    try {
      await this.userService.getUserById(userId);
    } catch (error) {
      logger.error('User not found when creating order', { userId, error });
      throw new NotFoundError({
        resource: 'User',
        id: userId,
        message: 'User not found. Please ensure you are properly authenticated.',
      });
    }
  }

  private async validateGroupOrder(groupOrderId: GroupOrderId): Promise<void> {
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    if (!canGroupOrderBeModified(groupOrder)) {
      throw new ValidationError({
        message: `Cannot modify user order. Group order status: ${groupOrder.status}`,
      });
    }
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

  private logOrderCreated(
    groupOrderId: GroupOrderId,
    userId: UserId,
    items: UserOrderItems
  ): void {
    logger.info('User order created/updated', {
      groupOrderId,
      userId,
      itemCounts: {
        tacos: items.tacos.length,
        extras: items.extras.length,
        drinks: items.drinks.length,
        desserts: items.desserts.length,
      },
    });
  }
}
