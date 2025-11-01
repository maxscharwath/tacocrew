/**
 * User order service
 * @module services/user-order
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '../database/group-order.repository';
import { UserOrderRepository } from '../database/user-order.repository';
import {
  GroupOrderStatus,
  Taco,
  UpdateUserOrderRequest,
  UserOrder,
  UserOrderItems,
  UserOrderStatus,
} from '../types';
import { NotFoundError, OutOfStockError, ValidationError } from '../utils/errors';
import { inject } from '../utils/inject';
import { logger } from '../utils/logger';
import {
  generateItemDeterministicUUID,
  generateTacoDeterministicUUID,
} from '../utils/deterministic-uuid';
import { ResourceService } from './resource.service';

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

    // Validate tacos
    for (const taco of items.tacos) {
      // Validate meats
      for (const meat of taco.meats) {
        if (!stock.viandes[meat.id]?.in_stock) {
          outOfStock.push(`Meat: ${meat.id} (${meat.name || meat.id})`);
        }
      }

      // Validate sauces
      for (const sauce of taco.sauces) {
        if (!stock.sauces[sauce.id]?.in_stock) {
          outOfStock.push(`Sauce: ${sauce.id} (${sauce.name || sauce.id})`);
        }
      }

      // Validate garnitures
      for (const garniture of taco.garnitures) {
        if (!stock.garnitures[garniture.id]?.in_stock) {
          outOfStock.push(`Garniture: ${garniture.id} (${garniture.name || garniture.id})`);
        }
      }
    }

    // Validate extras
    for (const extra of items.extras) {
      if (!stock.extras[extra.id]?.in_stock) {
        outOfStock.push(`Extra: ${extra.id} (${extra.name || extra.id})`);
      }
    }

    // Validate drinks
    for (const drink of items.drinks) {
      if (!stock.boissons[drink.id]?.in_stock) {
        outOfStock.push(`Drink: ${drink.id} (${drink.name || drink.id})`);
      }
    }

    // Validate desserts
    for (const dessert of items.desserts) {
      if (!stock.desserts[dessert.id]?.in_stock) {
        outOfStock.push(`Dessert: ${dessert.id} (${dessert.name || dessert.id})`);
      }
    }

    if (outOfStock.length > 0) {
      throw new OutOfStockError('Some items are out of stock', {
        outOfStockItems: outOfStock,
      });
    }
  }

  /**
   * Assign deterministic IDs to items
   */
  private assignDeterministicIds(items: UserOrderItems): UserOrderItems {
    return {
      tacos: items.tacos.map((taco) => ({
        ...taco,
        id: generateTacoDeterministicUUID({
          size: taco.size,
          meats: taco.meats.map((m) => ({ id: m.id, quantity: m.quantity })),
          sauces: taco.sauces.map((s) => s.id || s.name),
          garnitures: taco.garnitures.map((g) => g.id || g.name),
          note: taco.note,
        }),
      })),
      extras: items.extras.map((extra) => ({
        ...extra,
        id: generateItemDeterministicUUID(extra.id || extra.name, extra.quantity),
      })),
      drinks: items.drinks.map((drink) => ({
        ...drink,
        id: generateItemDeterministicUUID(drink.id || drink.name, drink.quantity),
      })),
      desserts: items.desserts.map((dessert) => ({
        ...dessert,
        id: generateItemDeterministicUUID(dessert.id || dessert.name, dessert.quantity),
      })),
    };
  }

  /**
   * Create or update user order
   */
  async upsertUserOrder(
    groupOrderId: string,
    username: string,
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
      throw new ValidationError(
        'Cannot modify user order outside of the allowed date range'
      );
    }

    // Validate and assign deterministic IDs
    const itemsWithIds = this.assignDeterministicIds(request.items);

    // Validate availability
    await this.validateItemAvailability(itemsWithIds);

    // Save user order
    const userOrder = await this.userOrderRepository.upsertUserOrder(
      groupOrderId,
      username,
      itemsWithIds,
      UserOrderStatus.DRAFT
    );

    logger.info('User order upserted', {
      groupOrderId,
      username,
      itemCounts: {
        tacos: itemsWithIds.tacos.length,
        extras: itemsWithIds.extras.length,
        drinks: itemsWithIds.drinks.length,
        desserts: itemsWithIds.desserts.length,
      },
    });

    return userOrder;
  }

  /**
   * Get user order
   */
  async getUserOrder(groupOrderId: string, username: string): Promise<UserOrder> {
    const userOrder = await this.userOrderRepository.getUserOrder(groupOrderId, username);
    if (!userOrder) {
      throw new NotFoundError(
        `User order not found for user ${username} in group order ${groupOrderId}`
      );
    }
    return userOrder;
  }

  /**
   * Submit user order (mark as submitted)
   */
  async submitUserOrder(groupOrderId: string, username: string): Promise<UserOrder> {
    // Get existing order
    const userOrder = await this.getUserOrder(groupOrderId, username);

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
      username,
      UserOrderStatus.SUBMITTED
    );
  }

  /**
   * Delete user order (user can delete their own, leader can delete any)
   */
  async deleteUserOrder(
    groupOrderId: string,
    username: string,
    deleterUsername: string
  ): Promise<void> {
    // Check if user is deleting their own order or if deleter is the leader
    const groupOrder = await this.groupOrderRepository.getGroupOrder(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${groupOrderId}`);
    }

    const isLeader = groupOrder.leader === deleterUsername;
    const isOwnOrder = username === deleterUsername;

    if (!isLeader && !isOwnOrder) {
      throw new ValidationError('You can only delete your own order or be the leader');
    }

    // Verify order exists
    const userOrder = await this.userOrderRepository.getUserOrder(groupOrderId, username);
    if (!userOrder) {
      throw new NotFoundError(
        `User order not found for user ${username} in group order ${groupOrderId}`
      );
    }

    // Can only delete if group order is still open
    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      throw new ValidationError(
        `Cannot delete user order. Group order status: ${groupOrder.status}`
      );
    }

    await this.userOrderRepository.deleteUserOrder(groupOrderId, username);

    logger.info('User order deleted', {
      groupOrderId,
      username,
      deletedBy: deleterUsername,
    });
  }

  /**
   * Get all user orders for a group order
   */
  async getUserOrdersByGroup(groupOrderId: string): Promise<UserOrder[]> {
    // Verify group order exists
    await this.groupOrderRepository.getGroupOrder(groupOrderId);
    return await this.userOrderRepository.getUserOrdersByGroup(groupOrderId);
  }
}
