/**
 * Submit group order use case
 * @module services/group-order
 */

import {
  CommandeError as ClientCommandeError,
  RestaurantClosedError as ClientRestaurantClosedError,
} from '@tacocrew/commande-client';
import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { t } from '@/lib/i18n';
import { canSubmitGroupOrder, type GroupOrderId } from '@/schemas/group-order.schema';
import { OrganizationId } from '@/schemas/organization.schema';
import type { UserId } from '@/schemas/user.schema';
import { isUserOrderEmpty, type UserOrder } from '@/schemas/user-order.schema';
import { BadgeEvaluationService } from '@/services/badge/badge-evaluation.service';
import { StatsTrackingService } from '@/services/badge/stats-tracking.service';
import { NotificationService } from '@/services/notification/notification.service';
import { SlackNotificationService } from '@/services/notification/slack-notification.service';
import {
  BackendOrderSubmissionService,
  type LegacyPaymentMethod,
  type SubmitGroupOrderResult,
} from '@/services/order/backend-order-submission.service';
import { ResourceService } from '@/services/resource/resource.service';
import type { Customer, DeliveryInfo, StockAvailability } from '@/shared/types/types';
import { GroupOrderStatus } from '@/shared/types/types';
import { NotFoundError, StoreClosedError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { calculateTotalPriceFromUserOrders } from '@/shared/utils/order-price.utils';
import { validateItemAvailability } from '@/shared/utils/order-validation.utils';

type ExecuteResult = {
  groupOrderId: GroupOrderId;
  submittedCount: number;
  orderId: string;
  transactionId: string;
  dryRun?: boolean;
  orderPreview?: SubmitGroupOrderResult['orderPreview'];
};

@injectable()
export class SubmitGroupOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly resourceService = inject(ResourceService);
  private readonly backendOrderSubmissionService = inject(BackendOrderSubmissionService);
  private readonly notificationService = inject(NotificationService);
  private readonly slackNotificationService = inject(SlackNotificationService);
  private readonly statsTrackingService = inject(StatsTrackingService);
  private readonly badgeEvaluationService = inject(BadgeEvaluationService);

  async execute(
    groupOrderId: GroupOrderId,
    customer: Customer,
    delivery: DeliveryInfo,
    paymentMethod?: LegacyPaymentMethod,
    dryRun = false
  ): Promise<ExecuteResult> {
    const groupOrder = await this.validateGroupOrder(groupOrderId);
    const userOrders = await this.getAndValidateUserOrders(groupOrderId);
    const stock = await this.resourceService.getStockForProcessing();

    this.validateUserOrders(userOrders, stock);

    const result = await this.submitToBackend(
      userOrders,
      customer,
      delivery,
      groupOrderId,
      paymentMethod,
      dryRun
    );

    const computedPrice = calculateTotalPriceFromUserOrders(userOrders);
    const backendTotalPrice = result.backendTotal ?? computedPrice;
    const fee = Math.max(backendTotalPrice - computedPrice, 0);

    await this.groupOrderRepository.update(groupOrderId, {
      sessionId: result.sessionId,
      status: GroupOrderStatus.SUBMITTED,
      fee,
      ...(dryRun ? {} : { commandeOrderId: result.orderId }),
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

    // Track badge progress for the leader (non-blocking, skip for dry runs)
    if (!dryRun) {
      this.trackGroupOrderLed(groupOrder.leaderId, groupOrderId).catch((error) => {
        logger.error('Failed to track group order led for badges', {
          leaderId: groupOrder.leaderId,
          error,
        });
      });
    }

    // Send Slack notification (non-blocking)
    if (groupOrder.organizationId) {
      const orgId = OrganizationId.parse(groupOrder.organizationId);
      this.slackNotificationService
        .sendGroupOrderSubmitted(groupOrderId, orderName, groupOrder.leaderId, orgId)
        .catch((error) => {
          logger.debug('Failed to send Slack notification for group order submission', { error });
        });
    }

    return {
      groupOrderId,
      submittedCount: userOrders.length,
      orderId: result.orderId,
      transactionId: result.transactionId,
      ...(dryRun && { dryRun: true }),
      ...(result.orderPreview !== undefined && { orderPreview: result.orderPreview }),
    };
  }

  /**
   * Track group order submission for badges
   */
  private async trackGroupOrderLed(leaderId: UserId, groupOrderId: GroupOrderId): Promise<void> {
    await this.statsTrackingService.trackGroupOrderLed(leaderId);
    await this.badgeEvaluationService.evaluateAfterEvent(leaderId, {
      type: 'groupOrderSubmitted',
      userId: leaderId,
      timestamp: new Date(),
      data: { groupOrderId },
    });
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
    paymentMethod?: LegacyPaymentMethod,
    dryRun = false
  ): Promise<SubmitGroupOrderResult> {
    try {
      return await this.backendOrderSubmissionService.submitGroupOrder({
        userOrders,
        customer,
        delivery,
        groupOrderId,
        paymentMethod,
        dryRun,
      });
    } catch (error) {
      if (error instanceof ClientRestaurantClosedError || error instanceof StoreClosedError) {
        throw error;
      }
      // Preserve the raw commande.app response excerpt when available — it's
      // the only signal we have for diagnosing schema mismatches in prod.
      const bodyExcerpt = error instanceof ClientCommandeError ? error.bodyExcerpt : undefined;
      logger.error('Failed to submit group order to backend', {
        groupOrderId,
        userOrderCount: userOrders.length,
        error: error instanceof Error ? error.message : String(error),
        ...(bodyExcerpt !== undefined && { bodyExcerpt }),
      });
      // Pass commande-client errors through unchanged so the global error
      // handler can map them to proper HTTP status codes (400/404/429/502)
      // and surface bodyExcerpt in its own log line.
      if (error instanceof ClientCommandeError) {
        throw error;
      }
      throw new ValidationError({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
