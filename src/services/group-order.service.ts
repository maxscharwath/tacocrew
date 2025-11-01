/**
 * Group order service
 * @module services/group-order
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { GroupOrderRepository } from '../database/group-order.repository';
import { UserOrderRepository } from '../database/user-order.repository';
import { CartService } from './cart.service';
import { OrderService } from './order.service';
import {
  CreateGroupOrderRequest,
  GroupOrder,
  GroupOrderStatus,
  GroupOrderWithUserOrders,
  SubmitGroupOrderRequest,
  UserOrderStatus,
} from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { inject } from '../utils/inject';
import { logger } from '../utils/logger';

/**
 * Group Order Service
 */
@injectable()
export class GroupOrderService {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);

  /**
   * Create a new group order
   */
  async createGroupOrder(
    leader: string,
    request: CreateGroupOrderRequest
  ): Promise<GroupOrder> {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ValidationError('Invalid date format. Use ISO date strings.');
    }

    if (startDate >= endDate) {
      throw new ValidationError('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new ValidationError('Start date cannot be in the past');
    }

    const groupOrderId = uuidv4();

    const groupOrder = await this.groupOrderRepository.createGroupOrder(groupOrderId, {
      name: request.name,
      leader,
      startDate,
      endDate,
    });

    logger.info('Group order created', {
      groupOrderId,
      leader,
      startDate: request.startDate,
      endDate: request.endDate,
    });

    return groupOrder;
  }

  /**
   * Get group order by ID
   */
  async getGroupOrder(groupOrderId: string): Promise<GroupOrder> {
    const groupOrder = await this.groupOrderRepository.getGroupOrder(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${groupOrderId}`);
    }
    return groupOrder;
  }

  /**
   * Get group order with all user orders
   */
  async getGroupOrderWithUserOrders(
    groupOrderId: string
  ): Promise<GroupOrderWithUserOrders> {
    const groupOrder = await this.getGroupOrder(groupOrderId);
    const userOrders = await this.userOrderRepository.getUserOrdersByGroup(groupOrderId);

    return {
      ...groupOrder,
      userOrders,
    };
  }

  /**
   * Check if user is the leader of a group order
   */
  async checkIsLeader(groupOrderId: string, username: string): Promise<boolean> {
    const groupOrder = await this.getGroupOrder(groupOrderId);
    return groupOrder.leader === username;
  }

  /**
   * Update group order (only leader can do this)
   */
  async updateGroupOrder(
    groupOrderId: string,
    username: string,
    updates: Partial<Pick<GroupOrder, 'name' | 'startDate' | 'endDate'>>
  ): Promise<GroupOrder> {
    // Verify user is the leader
    const isLeader = await this.checkIsLeader(groupOrderId, username);
    if (!isLeader) {
      throw new ValidationError('Only the group order leader can update the group order');
    }

    // Validate dates if provided
    if (updates.startDate || updates.endDate) {
      const current = await this.getGroupOrder(groupOrderId);
      const startDate = updates.startDate
        ? new Date(updates.startDate)
        : current.startDate;
      const endDate = updates.endDate ? new Date(updates.endDate) : current.endDate;

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ValidationError('Invalid date format');
      }

      if (startDate >= endDate) {
        throw new ValidationError('End date must be after start date');
      }
    }

    return await this.groupOrderRepository.updateGroupOrder(groupOrderId, updates);
  }

  /**
   * Submit group order (only leader can do this)
   * This marks the group order as submitted - actual submission happens in a separate step
   */
  async submitGroupOrder(groupOrderId: string, username: string): Promise<GroupOrder> {
    const isLeader = await this.checkIsLeader(groupOrderId, username);
    if (!isLeader) {
      throw new ValidationError('Only the group order leader can submit the group order');
    }

    const groupOrder = await this.getGroupOrder(groupOrderId);

    // Check if group order is still open
    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      throw new ValidationError(
        `Cannot submit group order. Current status: ${groupOrder.status}`
      );
    }

    // Check if we're still within the date range
    const now = new Date();
    if (now < groupOrder.startDate || now > groupOrder.endDate) {
      throw new ValidationError(
        'Cannot submit group order outside of the allowed date range'
      );
    }

    // Update status to submitted
    return await this.groupOrderRepository.updateGroupOrder(groupOrderId, {
      status: GroupOrderStatus.SUBMITTED,
    });
  }

  /**
   * Check if group order is open for new orders
   */
  async isOpenForOrders(groupOrderId: string): Promise<boolean> {
    const groupOrder = await this.getGroupOrder(groupOrderId);

    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      return false;
    }

    const now = new Date();
    return now >= groupOrder.startDate && now <= groupOrder.endDate;
  }

  /**
   * Submit group order to backend (creates real cart and order)
   * This consolidates all submitted user orders and creates a single order
   */
  async submitGroupOrderToBackend(
    groupOrderId: string,
    username: string,
    request: SubmitGroupOrderRequest
  ): Promise<{ orderId: string; cartId: string }> {
    // Verify user is the leader
    const isLeader = await this.checkIsLeader(groupOrderId, username);
    if (!isLeader) {
      throw new ValidationError('Only the group order leader can submit the group order');
    }

    // Get group order and all user orders
    const groupOrder = await this.getGroupOrder(groupOrderId);
    if (groupOrder.status !== GroupOrderStatus.SUBMITTED) {
      throw new ValidationError(
        'Group order must be marked as submitted before submitting to backend'
      );
    }

    const userOrders = await this.userOrderRepository.getUserOrdersByGroup(groupOrderId);

    // Filter only submitted orders
    const submittedOrders = userOrders.filter(
      (uo) => uo.status === UserOrderStatus.SUBMITTED
    );

    if (submittedOrders.length === 0) {
      throw new ValidationError('No submitted orders to process');
    }

    logger.info('Submitting group order to backend', {
      groupOrderId,
      submittedOrdersCount: submittedOrders.length,
    });

    // Create a new cart for this group order
    const { cartId } = await this.cartService.createCart();

    try {
      // Add all items from all user orders to the cart
      for (const userOrder of submittedOrders) {
        // Add tacos
        for (const taco of userOrder.items.tacos) {
          for (let q = 0; q < taco.quantity; q++) {
            await this.cartService.addTaco(cartId, {
              size: taco.size,
              meats: taco.meats.map((m) => ({ id: m.id, quantity: m.quantity })),
              sauces: taco.sauces.map((s) => s.id),
              garnitures: taco.garnitures.map((g) => g.id),
              note: taco.note,
            });
          }
        }

        // Add extras
        for (const extra of userOrder.items.extras) {
          for (let q = 0; q < extra.quantity; q++) {
            await this.cartService.addExtra(cartId, extra);
          }
        }

        // Add drinks
        for (const drink of userOrder.items.drinks) {
          for (let q = 0; q < drink.quantity; q++) {
            await this.cartService.addDrink(cartId, drink);
          }
        }

        // Add desserts
        for (const dessert of userOrder.items.desserts) {
          for (let q = 0; q < dessert.quantity; q++) {
            await this.cartService.addDessert(cartId, dessert);
          }
        }
      }

      // Create the actual order
      const order = await this.orderService.createOrder(cartId, request);

      // Update group order status to completed
      await this.groupOrderRepository.updateGroupOrder(groupOrderId, {
        status: GroupOrderStatus.COMPLETED,
      });

      logger.info('Group order submitted to backend successfully', {
        groupOrderId,
        cartId,
        orderId: order.orderId,
      });

      return {
        orderId: order.orderId,
        cartId,
      };
    } catch (error) {
      logger.error('Failed to submit group order to backend', {
        groupOrderId,
        cartId,
        error,
      });

      // Update status back to submitted (or keep as submitted) on error
      // The cart can be cleaned up later if needed
      throw error;
    }
  }
}
