/**
 * Group order service (refactored to use clean architecture)
 * @module services/group-order
 */

import { injectable } from 'tsyringe';
import { CreateGroupOrderRequestDto } from '@/application/dtos/group-order.dto';
import { CreateUserOrderRequestDto } from '@/application/dtos/user-order.dto';
import {
  CreateGroupOrderUseCase,
  CreateUserOrderUseCase,
  DeleteUserOrderUseCase,
  GetGroupOrderUseCase,
  GetGroupOrderWithUserOrdersUseCase,
  GetUserOrderUseCase,
  SubmitUserOrderUseCase,
} from '@/application/use-cases';
import type { CartId } from '@/domain/schemas/cart.schema';
import {
  GroupOrder,
  type GroupOrderId,
  isGroupOrderLeader,
  isGroupOrderOpenForOrders,
} from '@/domain/schemas/group-order.schema';
import type { OrderId } from '@/domain/schemas/order.schema';
import type { UserId } from '@/domain/schemas/user.schema';
import { isUserOrderSubmitted, type UserOrder } from '@/domain/schemas/user-order.schema';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { CartService } from '@/services/cart.service';
import { OrderService } from '@/services/order.service';
import { GroupOrderStatus, SubmitGroupOrderRequest } from '@/types';
import { ValidationError } from '@/utils/errors';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

/**
 * Group Order Service (Application Service)
 * Orchestrates use cases for group order operations
 */
@injectable()
export class GroupOrderService {
  // Use cases
  private readonly createGroupOrderUseCase = inject(CreateGroupOrderUseCase);
  private readonly getGroupOrderUseCase = inject(GetGroupOrderUseCase);
  private readonly getGroupOrderWithUserOrdersUseCase = inject(GetGroupOrderWithUserOrdersUseCase);
  private readonly createUserOrderUseCase = inject(CreateUserOrderUseCase);
  private readonly getUserOrderUseCase = inject(GetUserOrderUseCase);
  private readonly submitUserOrderUseCase = inject(SubmitUserOrderUseCase);
  private readonly deleteUserOrderUseCase = inject(DeleteUserOrderUseCase);

  // Infrastructure services (for backend submission)
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);

  /**
   * Create a new group order
   */
  async createGroupOrder(
    leaderId: UserId,
    request: CreateGroupOrderRequestDto
  ): Promise<GroupOrder> {
    return await this.createGroupOrderUseCase.execute(leaderId, request);
  }

  /**
   * Get group order by ID
   */
  async getGroupOrder(id: GroupOrderId): Promise<GroupOrder> {
    return await this.getGroupOrderUseCase.execute(id);
  }

  /**
   * Get group order with all user orders
   */
  async getGroupOrderWithUserOrders(id: GroupOrderId): Promise<{
    groupOrder: GroupOrder;
    userOrders: UserOrder[];
  }> {
    return await this.getGroupOrderWithUserOrdersUseCase.execute(id);
  }

  /**
   * Check if user is the leader of a group order
   */
  async checkIsLeader(id: GroupOrderId, userId: UserId): Promise<boolean> {
    const groupOrder = await this.getGroupOrderUseCase.execute(id);
    return isGroupOrderLeader(groupOrder, userId);
  }

  /**
   * Update group order (only leader can do this)
   */
  async updateGroupOrder(
    id: GroupOrderId,
    userId: UserId,
    updates: Partial<Pick<GroupOrder, 'name' | 'startDate' | 'endDate'>>
  ): Promise<GroupOrder> {
    // Verify user is the leader
    const isLeader = await this.checkIsLeader(id, userId);
    if (!isLeader) {
      throw new ValidationError('Only the group order leader can update the group order');
    }

    // Validate dates if provided
    if (updates.startDate || updates.endDate) {
      const current = await this.getGroupOrderUseCase.execute(id);
      const startDate = updates.startDate ?? current.startDate;
      const endDate = updates.endDate ?? current.endDate;

      if (startDate >= endDate) {
        throw new ValidationError('End date must be after start date');
      }
    }

    return await this.groupOrderRepository.update(id, updates);
  }

  /**
   * Submit group order (mark as submitted - ready for backend submission)
   */
  async submitGroupOrder(id: GroupOrderId, userId: UserId): Promise<GroupOrder> {
    const isLeader = await this.checkIsLeader(id, userId);
    if (!isLeader) {
      throw new ValidationError('Only the group order leader can submit the group order');
    }

    const groupOrder = await this.getGroupOrderUseCase.execute(id);

    // Check if group order is still open
    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      throw new ValidationError(`Cannot submit group order. Current status: ${groupOrder.status}`);
    }

    // Check if we're still within the date range
    if (!isGroupOrderOpenForOrders(groupOrder)) {
      throw new ValidationError('Cannot submit group order outside of the allowed date range');
    }

    // Update status to submitted
    return await this.groupOrderRepository.update(id, {
      status: GroupOrderStatus.SUBMITTED,
    });
  }

  /**
   * Submit group order to backend (creates real cart and order)
   */
  async submitGroupOrderToBackend(
    id: GroupOrderId,
    userId: UserId,
    request: SubmitGroupOrderRequest
  ): Promise<{ orderId: OrderId; cartId: CartId }> {
    // Verify user is the leader
    const isLeader = await this.checkIsLeader(id, userId);
    if (!isLeader) {
      throw new ValidationError('Only the group order leader can submit the group order');
    }

    const { groupOrder, userOrders } = await this.getGroupOrderWithUserOrdersUseCase.execute(id);

    if (groupOrder.status !== GroupOrderStatus.SUBMITTED) {
      throw new ValidationError(
        'Group order must be marked as submitted before submitting to backend'
      );
    }

    // Filter only submitted orders
    const submittedOrders = userOrders.filter((uo) => isUserOrderSubmitted(uo));

    if (submittedOrders.length === 0) {
      throw new ValidationError('No submitted orders to process');
    }

    logger.info('Submitting group order to backend', {
      id,
      submittedOrdersCount: submittedOrders.length,
    });

    // Create a new cart for this group order
    const { id: cartId } = await this.cartService.createCart();

    try {
      // Add all items from all user orders to the cart
      for (const userOrder of submittedOrders) {
        // Add tacos
        for (const taco of userOrder.items.tacos) {
          for (let q = 0; q < taco.quantity; q++) {
            await this.cartService.addTaco(cartId, {
              size: taco.size,
              meats: taco.meats.map((m) => ({ id: m.code, quantity: m.quantity })),
              sauces: taco.sauces.map((s) => s.code),
              garnitures: taco.garnitures.map((g) => g.code),
              note: taco.note,
            });
          }
        }

        // Add extras, drinks, desserts
        for (const extra of userOrder.items.extras) {
          for (let q = 0; q < extra.quantity; q++) {
            await this.cartService.addExtra(cartId, extra);
          }
        }

        for (const drink of userOrder.items.drinks) {
          for (let q = 0; q < drink.quantity; q++) {
            await this.cartService.addDrink(cartId, drink);
          }
        }

        for (const dessert of userOrder.items.desserts) {
          for (let q = 0; q < dessert.quantity; q++) {
            await this.cartService.addDessert(cartId, dessert);
          }
        }
      }

      // Create the actual order
      const order = await this.orderService.createOrder(cartId, request, userId);
      const orderId = order.id;

      // Update group order status to completed
      await this.groupOrderRepository.update(id, {
        status: GroupOrderStatus.COMPLETED,
      });

      logger.info('Group order submitted to backend successfully', {
        id,
        cartId,
        orderId: order.id,
      });

      return {
        orderId,
        cartId,
      };
    } catch (error) {
      logger.error('Failed to submit group order to backend', {
        id,
        cartId,
        error,
      });
      throw error;
    }
  }

  /**
   * User order operations (delegate to use cases)
   */
  async createUserOrder(
    id: GroupOrderId,
    userId: UserId,
    request: CreateUserOrderRequestDto
  ): Promise<UserOrder> {
    return await this.createUserOrderUseCase.execute(id, userId, request);
  }

  async getUserOrder(id: GroupOrderId, userId: UserId): Promise<UserOrder> {
    return await this.getUserOrderUseCase.execute(id, userId);
  }

  async submitUserOrder(id: GroupOrderId, userId: UserId): Promise<UserOrder> {
    return await this.submitUserOrderUseCase.execute(id, userId);
  }

  async deleteUserOrder(id: GroupOrderId, userId: UserId, deleterUserId: UserId): Promise<void> {
    return await this.deleteUserOrderUseCase.execute(id, userId, deleterUserId);
  }
}
