/**
 * Submit group order use case
 * @module services/group-order
 */

import { PaymentMethod } from '@tacobot/gigatacos-client';
import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '../../infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '../../infrastructure/repositories/user-order.repository';
import { canAcceptOrders, type GroupOrderId } from '../../schemas/group-order.schema';
import { isUserOrderEmpty, type UserOrder } from '../../schemas/user-order.schema';
import type { Customer, DeliveryInfo, StockAvailability } from '../../shared/types/types';
import { GroupOrderStatus } from '../../shared/types/types';
import { NotFoundError, ValidationError } from '../../shared/utils/errors.utils';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';
import { validateItemAvailability } from '../../shared/utils/order-validation.utils';
import { BackendOrderSubmissionService } from '../order/backend-order-submission.service';
import { ResourceService } from '../resource/resource.service';

type SubmissionResult = {
  orderId: string;
  transactionId: string;
  orderData: unknown;
  sessionId: string;
  dryRun?: boolean;
};

type ExecuteResult = {
  groupOrderId: GroupOrderId;
  submittedCount: number;
  orderId: string;
  transactionId: string;
  dryRun?: boolean;
};

@injectable()
export class SubmitGroupOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly resourceService = inject(ResourceService);
  private readonly backendOrderSubmissionService = inject(BackendOrderSubmissionService);

  async execute(
    groupOrderId: GroupOrderId,
    customer: Customer,
    delivery: DeliveryInfo,
    paymentMethod?: PaymentMethod,
    dryRun = false
  ): Promise<ExecuteResult> {
    await this.validateGroupOrder(groupOrderId);
    const userOrders = await this.getAndValidateUserOrders(groupOrderId);
    const stock = await this.resourceService.getStock();

    this.validateUserOrders(userOrders, stock);

    const result = await this.submitToBackend(
      userOrders,
      customer,
      delivery,
      groupOrderId,
      paymentMethod,
      dryRun
    );

    await this.groupOrderRepository.update(groupOrderId, {
      sessionId: result.sessionId,
      status: GroupOrderStatus.SUBMITTED,
    });

    logger.info(dryRun ? 'Group order dry run completed' : 'Group order submitted', {
      groupOrderId,
      submittedCount: userOrders.length,
      orderId: result.orderId,
      transactionId: result.transactionId,
      dryRun,
    });

    return {
      groupOrderId,
      submittedCount: userOrders.length,
      orderId: result.orderId,
      transactionId: result.transactionId,
      ...(dryRun && { dryRun: true }),
    };
  }

  private async validateGroupOrder(groupOrderId: GroupOrderId) {
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    if (!canAcceptOrders(groupOrder)) {
      const errorKey =
        groupOrder.status !== GroupOrderStatus.OPEN
          ? 'errors.orders.submit.invalidStatus'
          : 'errors.orders.submit.expired';
      throw new ValidationError(
        groupOrder.status !== GroupOrderStatus.OPEN ? { status: groupOrder.status } : {},
        errorKey
      );
    }

    return groupOrder;
  }

  private async getAndValidateUserOrders(groupOrderId: GroupOrderId) {
    const userOrders = await this.userOrderRepository.findByGroup(groupOrderId);
    if (userOrders.length === 0) {
      throw new ValidationError({}, 'errors.orders.submit.noUserOrders');
    }
    return userOrders;
  }

  private validateUserOrders(userOrders: UserOrder[], stock: StockAvailability) {
    for (const userOrder of userOrders) {
      if (isUserOrderEmpty(userOrder)) {
        throw new ValidationError(
          { userId: userOrder.userId },
          'errors.orders.submit.emptyUserOrder'
        );
      }
      validateItemAvailability(userOrder.items, stock);
    }
  }

  private async submitToBackend(
    userOrders: UserOrder[],
    customer: Customer,
    delivery: DeliveryInfo,
    groupOrderId: GroupOrderId,
    paymentMethod?: PaymentMethod,
    dryRun = false
  ): Promise<SubmissionResult> {
    try {
      return await this.backendOrderSubmissionService.submitGroupOrder(
        userOrders,
        customer,
        delivery,
        groupOrderId,
        paymentMethod,
        dryRun
      );
    } catch (error) {
      logger.error('Failed to submit group order to backend', {
        groupOrderId,
        userOrderCount: userOrders.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ValidationError({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
