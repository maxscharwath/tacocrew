/**
 * Update user order reimbursement status use case
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { t } from '@/lib/i18n';
import type { GroupOrderId } from '@/schemas/group-order.schema';
import type { UserId } from '@/schemas/user.schema';
import type { UserOrder, UserOrderId } from '@/schemas/user-order.schema';
import { BadgeEvaluationService } from '@/services/badge/badge-evaluation.service';
import { StatsTrackingService } from '@/services/badge/stats-tracking.service';
import { NotificationService } from '@/services/notification/notification.service';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

@injectable()
export class UpdateUserOrderReimbursementStatusUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly notificationService = inject(NotificationService);
  private readonly statsTrackingService = inject(StatsTrackingService);
  private readonly badgeEvaluationService = inject(BadgeEvaluationService);

  async execute(
    groupOrderId: GroupOrderId,
    userOrderId: UserOrderId,
    requesterId: UserId,
    reimbursed: boolean
  ): Promise<UserOrder> {
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    if (groupOrder.leaderId !== requesterId) {
      throw new ValidationError({ requesterId }, 'errors.orders.reimbursement.leaderOnly');
    }

    const userOrder = await this.userOrderRepository.findById(userOrderId);
    if (userOrder?.groupOrderId !== groupOrderId) {
      throw new NotFoundError({ resource: 'UserOrder', id: userOrderId });
    }

    const reimbursedAt = reimbursed ? new Date() : null;
    const updatedOrder = await this.userOrderRepository.update(userOrderId, {
      reimbursed,
      reimbursedAt,
      reimbursedByUserId: reimbursed ? requesterId : null,
    });

    // Track badge when leader confirms payment and someone else paid for the order
    if (reimbursed && userOrder.participantPayment.paidBy?.id) {
      const paidByUserId = userOrder.participantPayment.paidBy.id as UserId;
      const orderOwnerId = userOrder.userId;

      // Only track if someone else (not the order owner) paid
      if (paidByUserId !== orderOwnerId) {
        this.statsTrackingService
          .trackPaidForOther(paidByUserId)
          .then(() => {
            // Evaluate badges after tracking the stat
            return this.badgeEvaluationService.evaluateAfterEvent(paidByUserId, {
              type: 'paidForOther',
              userId: paidByUserId,
              timestamp: new Date(),
              data: {
                userOrderId,
                groupOrderId,
              },
            });
          })
          .catch((error) => {
            // Don't throw - badge tracking/evaluation should not block reimbursement
            logger.error('Failed to track badge for paying for other', {
              userId: paidByUserId,
              error,
            });
          });
      }
    }

    // Notify the user when their order reimbursement status changes
    if (userOrder.userId !== requesterId) {
      this.notificationService
        .sendToUser(userOrder.userId, {
          type: 'reimbursement_update',
          title: t('notifications.reimbursementUpdate.title'),
          body: reimbursed
            ? t('notifications.reimbursementUpdate.bodyReimbursed')
            : t('notifications.reimbursementUpdate.bodyUpdated'),
          tag: `reimbursement-${groupOrderId}-${userOrderId}`,
          url: `/orders/${groupOrderId}`,
          data: {
            groupOrderId,
            userOrderId,
            reimbursed,
          },
        })
        .catch(() => {
          // Ignore notification errors
        });
    }

    return updatedOrder;
  }
}
