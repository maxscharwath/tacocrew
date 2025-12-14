/**
 * Submit group order use case
 * @module services/group-order
 */

import { PaymentMethod } from '@tacocrew/gigatacos-client';
import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { t } from '@/lib/i18n';
import { canSubmitGroupOrder, type GroupOrderId } from '@/schemas/group-order.schema';
import { isUserOrderEmpty, type UserOrder } from '@/schemas/user-order.schema';
import { NotificationService } from '@/services/notification/notification.service';
import { BackendOrderSubmissionService } from '@/services/order/backend-order-submission.service';
import { ResourceService } from '@/services/resource/resource.service';
import type { Customer, DeliveryInfo, StockAvailability } from '@/shared/types/types';
import { GroupOrderStatus } from '@/shared/types/types';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { calculateTotalPriceFromUserOrders } from '@/shared/utils/order-price.utils';
import { validateItemAvailability } from '@/shared/utils/order-validation.utils';

type SubmissionResult = {
  orderId: string;
  transactionId: string;
  orderData: unknown;
  sessionId: string;
  orderSummary: import('@tacocrew/gigatacos-client').OrderSummary | null;
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
  private readonly notificationService = inject(NotificationService);

  async execute(
    groupOrderId: GroupOrderId,
    customer: Customer,
    delivery: DeliveryInfo,
    paymentMethod?: PaymentMethod,
    dryRun = false
  ): Promise<ExecuteResult> {
    const groupOrder = await this.validateGroupOrder(groupOrderId);
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

    // Calculate fee: difference between backend total price and computed price
    const computedPrice = calculateTotalPriceFromUserOrders(userOrders);
    const backendTotalPrice = result.orderSummary?.totalAmount ?? computedPrice;
    const backendDeliveryFee = result.orderSummary?.deliveryFee;
    const fee = backendDeliveryFee ?? Math.max(backendTotalPrice - computedPrice, 0);

    await this.groupOrderRepository.update(groupOrderId, {
      sessionId: result.sessionId,
      status: GroupOrderStatus.SUBMITTED,
      fee,
    });

    logger.info('Fee calculated and stored', {
      groupOrderId,
      computedPrice,
      backendTotalPrice,
      fee,
    });

    logger.info(dryRun ? 'Group order dry run completed' : 'Group order submitted', {
      groupOrderId,
      submittedCount: userOrders.length,
      orderId: result.orderId,
      transactionId: result.transactionId,
      dryRun,
    });

    // Notify all participants that the order has been submitted (including dry run)
    const participantIds = [...new Set(userOrders.map((order) => order.userId))];
    const orderName = groupOrder.name || 'the group order';

    // Send localized notifications to each participant
    const notificationPromises = participantIds.map(async (participantId) => {
      try {
        await this.notificationService.sendToUser(participantId, {
          type: 'submitted',
          title: t('notifications.orderSubmitted.title'),
          body: t('notifications.orderSubmitted.body', { orderName }),
          tag: `submitted-${groupOrderId}${dryRun ? '-dryrun' : ''}`,
          url: `/orders/${groupOrderId}`,
          data: {
            groupOrderId,
            type: 'submitted',
            orderId: result.orderId,
            transactionId: result.transactionId,
            dryRun,
          },
        });
      } catch (error) {
        // Ignore notification errors
        logger.debug('Failed to send notification to user', { participantId, error });
      }
    });
    await Promise.allSettled(notificationPromises);

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

    // Only check status, not time window - organizer can submit after endDate
    if (!canSubmitGroupOrder(groupOrder)) {
      throw new ValidationError(
        { status: groupOrder.status },
        'errors.orders.submit.invalidStatus'
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
