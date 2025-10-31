/**
 * Group Order Service
 * Manages group order creation, item management, and submission
 */

import {
  GroupOrder,
  GroupOrderStatus,
  CreateGroupOrderRequest,
  AddItemToGroupOrderRequest,
  RemoveItemFromGroupOrderRequest,
  SubmitGroupOrderRequest,
  GroupOrderItem,
  GroupOrderSummary,
  Order,
  TacoConfig,
} from '@/types';
import { getGroupOrderStorage } from '@/utils/group-order-storage';
import { getTacosApiService } from '@/services/tacos-api.service';
import { logger } from '@/utils/logger';
import { ValidationError, NotFoundError } from '@/types/errors';

/**
 * Service for managing group orders
 */
export class GroupOrderService {
  private storage = getGroupOrderStorage();
  private tacosService = getTacosApiService();

  /**
   * Create a new group order
   */
  createGroupOrder(request: CreateGroupOrderRequest): GroupOrder {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + request.expiresInMinutes * 60 * 1000);

    const orderId = this.generateOrderId();

    const order: GroupOrder = {
      id: orderId,
      name: request.name,
      createdBy: request.createdBy,
      createdAt: now,
      expiresAt,
      status: 'active',
      items: [],
      summary: {
        totalItems: 0,
        totalPrice: 0,
        participantCount: 0,
        itemsByUser: {},
      },
    };

    this.storage.set(orderId, order);

    logger.info(`Group order created: ${orderId} by ${request.createdBy.name}`);

    return order;
  }

  /**
   * Get a group order by ID
   */
  getGroupOrder(orderId: string): GroupOrder {
    const order = this.storage.get(orderId);

    if (!order) {
      throw new NotFoundError(`Group order ${orderId} not found`);
    }

    // Check if expired
    if (order.status === 'active' && order.expiresAt < new Date()) {
      order.status = 'expired';
      this.storage.set(orderId, order);
    }

    return order;
  }

  /**
   * Add an item to a group order
   */
  addItem(request: AddItemToGroupOrderRequest): GroupOrderItem {
    const order = this.getGroupOrder(request.orderId);

    // Validate order is active
    if (order.status !== 'active') {
      throw new ValidationError(`Group order is ${order.status} and cannot accept new items`);
    }

    // Check if expired
    if (order.expiresAt < new Date()) {
      order.status = 'expired';
      this.storage.set(order.id, order);
      throw new ValidationError('Group order has expired');
    }

    // Generate item ID
    const itemId = this.generateItemId();

    // For now, we'll estimate price (in production, this would come from the backend)
    const estimatedPrice = this.estimateTacoPrice(request.taco);

    const item: GroupOrderItem = {
      id: itemId,
      userId: request.userId,
      userName: request.userName,
      taco: request.taco,
      quantity: request.quantity || 1,
      price: estimatedPrice,
      addedAt: new Date(),
    };

    order.items.push(item);
    this.updateSummary(order);
    this.storage.set(order.id, order);

    logger.info(`Item added to group order ${order.id} by ${request.userName}`);

    return item;
  }

  /**
   * Remove an item from a group order
   */
  removeItem(request: RemoveItemFromGroupOrderRequest): void {
    const order = this.getGroupOrder(request.orderId);

    // Validate order is active
    if (order.status !== 'active') {
      throw new ValidationError(`Group order is ${order.status} and cannot be modified`);
    }

    // Find and remove item
    const itemIndex = order.items.findIndex(
      (item) => item.id === request.itemId && item.userId === request.userId
    );

    if (itemIndex === -1) {
      throw new NotFoundError('Item not found or you do not have permission to remove it');
    }

    order.items.splice(itemIndex, 1);
    this.updateSummary(order);
    this.storage.set(order.id, order);

    logger.info(`Item removed from group order ${order.id} by ${request.userId}`);
  }

  /**
   * Close a group order (stop accepting new items)
   */
  closeGroupOrder(orderId: string, userId: string): GroupOrder {
    const order = this.getGroupOrder(orderId);

    // Only creator can close
    if (order.createdBy.id !== userId) {
      throw new ValidationError('Only the creator can close the group order');
    }

    if (order.status !== 'active') {
      throw new ValidationError(`Group order is already ${order.status}`);
    }

    order.status = 'closed';
    this.storage.set(orderId, order);

    logger.info(`Group order ${orderId} closed by ${userId}`);

    return order;
  }

  /**
   * Submit a group order
   */
  async submitGroupOrder(request: SubmitGroupOrderRequest): Promise<Order> {
    const order = this.getGroupOrder(request.orderId);

    // Validate order can be submitted
    if (order.status === 'submitted') {
      throw new ValidationError('Group order has already been submitted');
    }

    if (order.items.length === 0) {
      throw new ValidationError('Cannot submit empty group order');
    }

    // Build cart from group order items
    // We need to add each item to the backend cart, then submit
    // For now, we'll simulate this by creating a combined order
    
    // In a real implementation, you would:
    // 1. Clear the current cart
    // 2. Add all items from group order to cart
    // 3. Submit the order
    // 4. Mark group order as submitted

    // For now, we'll create a transaction that combines all items
    // Note: This is a simplified version - in production you'd need to
    // properly add each item to the backend cart
    
    try {
      // Add all tacos to cart
      for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
          await this.tacosService.addTacoToCart(item.taco);
        }
      }

      // Submit the order
      const submittedOrder = await this.tacosService.submitOrder(
        request.customer,
        request.delivery
      );

      // Mark group order as submitted
      order.status = 'submitted';
      this.storage.set(order.id, order);

      logger.info(`Group order ${order.id} submitted successfully`);

      return submittedOrder;
    } catch (error) {
      logger.error('Failed to submit group order', error);
      throw error;
    }
  }

  /**
   * Get all active group orders
   */
  getAllActiveGroupOrders(): GroupOrder[] {
    return this.storage.getAllActive();
  }

  /**
   * Update group order summary
   */
  private updateSummary(order: GroupOrder): void {
    const itemsByUser: Record<string, GroupOrderItem[]> = {};
    let totalPrice = 0;
    const userIds = new Set<string>();

    order.items.forEach((item) => {
      userIds.add(item.userId);
      totalPrice += item.price * item.quantity;

      if (!itemsByUser[item.userId]) {
        itemsByUser[item.userId] = [];
      }
      itemsByUser[item.userId].push(item);
    });

    order.summary = {
      totalItems: order.items.length,
      totalPrice,
      participantCount: userIds.size,
      itemsByUser,
    };
  }

  /**
   * Estimate taco price based on size
   * In production, this would fetch actual prices from the backend
   */
  private estimateTacoPrice(taco: TacoConfig): number {
    const sizePrices: Record<string, number> = {
      tacos_L: 8.5,
      tacos_BOWL: 9.5,
      tacos_L_mixte: 10.5,
      tacos_XL: 12.5,
      tacos_XXL: 15.5,
      tacos_GIGA: 18.5,
    };

    return sizePrices[taco.size] || 10.0;
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique item ID
   */
  private generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Singleton instance
 */
let serviceInstance: GroupOrderService | null = null;

/**
 * Get group order service instance
 */
export function getGroupOrderService(): GroupOrderService {
  if (!serviceInstance) {
    serviceInstance = new GroupOrderService();
  }
  return serviceInstance;
}
