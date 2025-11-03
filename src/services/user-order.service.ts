/**
 * User order service
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/database/group-order.repository';
import { UserOrderRepository } from '@/database/user-order.repository';
import { ResourceService } from '@/services/resource.service';
import {
  GroupOrderId,
  GroupOrderStatus,
  StockItem,
  UpdateUserOrderRequest,
  UserId,
  UserOrder,
  UserOrderItems,
  UserOrderStatus,
} from '@/types';
import { NotFoundError, OutOfStockError, ValidationError } from '@/utils/errors';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

/**
 * User Order Service
 */
@injectable()
export class UserOrderService {
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly resourceService = inject(ResourceService);

  /**
   * Validate item availability against delivery backend
   */
  private async validateItemAvailability(items: UserOrderItems): Promise<void> {
    const stock = await this.resourceService.getStock();
    const outOfStock: string[] = [];
    const notFound: string[] = [];

    const validateItem = <T extends { id: string; code: string; name: string }>(
      item: T,
      stockItems: StockItem[],
      category: string
    ): void => {
      const stockItem = stockItems.find((s) => s.id === item.id);
      if (!stockItem) {
        notFound.push(`${category}: ${item.code} (${item.name})`);
      } else if (!stockItem.in_stock) {
        outOfStock.push(`${category}: ${item.code} (${item.name})`);
      }
    };

    // Validate tacos
    for (const taco of items.tacos) {
      for (const meat of taco.meats) {
        validateItem(meat, stock.meats, 'Meat');
      }
      for (const sauce of taco.sauces) {
        validateItem(sauce, stock.sauces, 'Sauce');
      }
      for (const garniture of taco.garnitures) {
        validateItem(garniture, stock.garnishes, 'Garniture');
      }
    }

    // Validate other items
    for (const extra of items.extras) {
      validateItem(extra, stock.extras, 'Extra');
    }
    for (const drink of items.drinks) {
      validateItem(drink, stock.drinks, 'Drink');
    }
    for (const dessert of items.desserts) {
      validateItem(dessert, stock.desserts, 'Dessert');
    }

    if (notFound.length > 0 || outOfStock.length > 0) {
      const message =
        notFound.length > 0
          ? `Some items are no longer available: ${notFound.join(', ')}${outOfStock.length > 0 ? `; Some items are out of stock: ${outOfStock.join(', ')}` : ''}`
          : `Some items are out of stock: ${outOfStock.join(', ')}`;

      throw new OutOfStockError(message, {
        notFoundItems: notFound,
        outOfStockItems: outOfStock,
      });
    }
  }

  /**
   * Create or update user order
   * Note: Items should already have IDs computed (e.g., from use case)
   */
  async upsertUserOrder(
    groupOrderId: GroupOrderId,
    userId: UserId,
    request: UpdateUserOrderRequest
  ): Promise<UserOrder> {
    // Verify group order exists and is open
    const groupOrder = await this.groupOrderRepository.getGroupOrder(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${groupOrderId}`);
    }

    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      throw new ValidationError(
        `Cannot modify user order. Group order status: ${groupOrder.status}`
      );
    }

    // Check date range
    const now = new Date();
    if (now < groupOrder.startDate || now > groupOrder.endDate) {
      throw new ValidationError('Cannot modify user order outside of the allowed date range');
    }

    // Validate availability (items should already have IDs from use case)
    await this.validateItemAvailability(request.items);

    // Save user order
    const userOrder = await this.userOrderRepository.upsertUserOrder(
      groupOrderId,
      userId,
      request.items,
      UserOrderStatus.DRAFT
    );

    logger.info('User order upserted', {
      groupOrderId,
      userId,
      itemCounts: {
        tacos: request.items.tacos.length,
        extras: request.items.extras.length,
        drinks: request.items.drinks.length,
        desserts: request.items.desserts.length,
      },
    });

    return userOrder;
  }

  /**
   * Get user order
   */
  async getUserOrder(groupOrderId: GroupOrderId, userId: UserId): Promise<UserOrder> {
    const userOrder = await this.userOrderRepository.getUserOrder(groupOrderId, userId);
    if (!userOrder) {
      throw new NotFoundError(
        `User order not found for user ${userId} in group order ${groupOrderId}`
      );
    }
    return userOrder;
  }

  /**
   * Submit user order (mark as submitted)
   */
  async submitUserOrder(groupOrderId: GroupOrderId, userId: UserId): Promise<UserOrder> {
    // Get existing order
    const userOrder = await this.getUserOrder(groupOrderId, userId);

    // Verify group order is still open
    const groupOrder = await this.groupOrderRepository.getGroupOrder(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${groupOrderId}`);
    }

    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      throw new ValidationError(
        `Cannot submit user order. Group order status: ${groupOrder.status}`
      );
    }

    // Validate that order is not empty
    const hasItems =
      userOrder.items.tacos.length > 0 ||
      userOrder.items.extras.length > 0 ||
      userOrder.items.drinks.length > 0 ||
      userOrder.items.desserts.length > 0;

    if (!hasItems) {
      throw new ValidationError('Cannot submit an empty order');
    }

    // Re-validate availability before submitting
    await this.validateItemAvailability(userOrder.items);

    // Update status
    return await this.userOrderRepository.updateUserOrderStatus(
      groupOrderId,
      userId,
      UserOrderStatus.SUBMITTED
    );
  }

  /**
   * Delete user order (user can delete their own, leader can delete any)
   */
  async deleteUserOrder(
    groupOrderId: GroupOrderId,
    userId: UserId,
    deleterUserId: UserId
  ): Promise<void> {
    // Check if user is deleting their own order or if deleter is the leader
    const groupOrder = await this.groupOrderRepository.getGroupOrder(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${groupOrderId}`);
    }

    const isLeader = groupOrder.leader === deleterUserId;
    const isOwnOrder = userId === deleterUserId;

    if (!isLeader && !isOwnOrder) {
      throw new ValidationError('You can only delete your own order or be the leader');
    }

    // Verify order exists
    const userOrder = await this.userOrderRepository.getUserOrder(groupOrderId, userId);
    if (!userOrder) {
      throw new NotFoundError(
        `User order not found for user ${userId} in group order ${groupOrderId}`
      );
    }

    // Can only delete if group order is still open
    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      throw new ValidationError(
        `Cannot delete user order. Group order status: ${groupOrder.status}`
      );
    }

    await this.userOrderRepository.deleteUserOrder(groupOrderId, userId);

    logger.info('User order deleted', {
      groupOrderId,
      userId,
      deletedBy: deleterUserId,
    });
  }

  /**
   * Get all user orders for a group order
   */
  async getUserOrdersByGroup(groupOrderId: GroupOrderId): Promise<UserOrder[]> {
    // Verify group order exists
    await this.groupOrderRepository.getGroupOrder(groupOrderId);
    return await this.userOrderRepository.getUserOrdersByGroup(groupOrderId);
  }
}
