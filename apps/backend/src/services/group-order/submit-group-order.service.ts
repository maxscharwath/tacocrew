/**
 * Submit group order use case
 * Submits all user orders in a group order at once
 * @module services/group-order
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { canAcceptOrders, type GroupOrderId } from '@/schemas/group-order.schema';
import { isUserOrderEmpty } from '@/schemas/user-order.schema';
import { BackendOrderSubmissionService } from '@/services/order/backend-order-submission.service';
import { ResourceService } from '@/services/resource/resource.service';
import type { Customer, DeliveryInfo } from '@/shared/types/types';
import { GroupOrderStatus, UserOrderStatus } from '@/shared/types/types';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { validateItemAvailability } from '@/shared/utils/order-validation.utils';

/**
 * Submit group order use case
 * Submits all user orders in the group order
 */
@injectable()
export class SubmitGroupOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly resourceService = inject(ResourceService);
  private readonly backendOrderSubmissionService = inject(BackendOrderSubmissionService);

  async execute(
    groupOrderId: GroupOrderId,
    customer: Customer,
    delivery: DeliveryInfo
  ): Promise<{
    groupOrderId: GroupOrderId;
    submittedCount: number;
    orderId: string;
    transactionId: string;
  }> {
    // Get group order
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${groupOrderId}`);
    }

    // Check if the group order can accept orders (must be OPEN and within date range)
    if (!canAcceptOrders(groupOrder)) {
      const reason =
        groupOrder.status !== GroupOrderStatus.OPEN
          ? `status is ${groupOrder.status}`
          : 'order period has expired';
      throw new ValidationError(`Cannot submit group order: ${reason}`);
    }

    // Get all user orders
    const userOrders = await this.userOrderRepository.findByGroup(groupOrderId);

    if (userOrders.length === 0) {
      throw new ValidationError('Cannot submit group order with no user orders');
    }

    // Fetch stock once for all validations
    const stock = await this.resourceService.getStock();

    // Validate all orders
    for (const userOrder of userOrders) {
      if (isUserOrderEmpty(userOrder)) {
        throw new ValidationError(
          `Cannot submit group order. User order for user ${userOrder.userId} is empty`
        );
      }

      // Validate availability
      validateItemAvailability(userOrder.items, stock);
    }

    // Submit all user orders as a single combined order to backend
    let result: { orderId: string; transactionId: string; orderData: unknown };
    try {
      result = await this.backendOrderSubmissionService.submitGroupOrder(
        userOrders,
        customer,
        delivery
      );
    } catch (error) {
      logger.error('Failed to submit group order to backend', {
        groupOrderId,
        userOrderCount: userOrders.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ValidationError(
        `Failed to submit group order: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Update all user orders status in database
    for (const userOrder of userOrders) {
      await this.userOrderRepository.updateStatus(userOrder.id, UserOrderStatus.SUBMITTED);
    }

    // Update group order status to submitted
    await this.groupOrderRepository.update(groupOrderId, {
      status: GroupOrderStatus.SUBMITTED,
    });

    const submittedCount = userOrders.length;

    logger.info('Group order submitted', {
      groupOrderId,
      submittedCount,
      orderId: result.orderId,
      transactionId: result.transactionId,
    });

    return {
      groupOrderId,
      submittedCount,
      orderId: result.orderId,
      transactionId: result.transactionId,
    };
  }
}
