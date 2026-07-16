/**
 * Order status notification service — pushes a localized notification to every
 * participant of a group order when a new commande.app status transition is
 * observed (recorded by `CommandeOrderEventService`).
 *
 * Uses a per-order notification `tag` so successive status pushes replace one
 * another in the browser instead of stacking up.
 *
 * @module services/order/order-status-notification
 */

import { injectable } from 'tsyringe';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { t } from '@/lib/i18n';
import {
  COMMANDE_ORDER_STATUSES,
  type CommandeOrderStatus,
} from '@/schemas/commande-order-event.schema';
import type { GroupOrderId } from '@/schemas/group-order.schema';
import { NotificationService } from '@/services/notification/notification.service';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

export type NotifyStatusChangeInput = {
  readonly groupOrderId: GroupOrderId;
  readonly commandeOrderId: string;
  readonly status: CommandeOrderStatus;
};

const KNOWN_STATUSES: ReadonlySet<string> = new Set(COMMANDE_ORDER_STATUSES);

@injectable()
export class OrderStatusNotificationService {
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly notificationService = inject(NotificationService);

  /**
   * Notify every participant of the group order about a status transition.
   * Failures are logged and swallowed — notifications must never break the
   * status read path that triggers them.
   */
  async notifyStatusChange(input: NotifyStatusChangeInput): Promise<void> {
    const { groupOrderId, commandeOrderId, status } = input;

    const userOrders = await this.userOrderRepository.findByGroup(groupOrderId);
    const participantIds = [...new Set(userOrders.map((order) => order.userId))];
    if (participantIds.length === 0) return;

    const bodyKey = KNOWN_STATUSES.has(status)
      ? `notifications.orderStatusUpdate.status.${status}`
      : 'notifications.orderStatusUpdate.status.generic';

    const results = await Promise.allSettled(
      participantIds.map((participantId) =>
        this.notificationService.sendToUser(participantId, {
          type: 'order-status',
          title: t('notifications.orderStatusUpdate.title'),
          body: t(bodyKey, { status }),
          // One tag per commande.app order: each new status replaces the
          // previous notification instead of piling up.
          tag: `order-status-${commandeOrderId}`,
          url: `/orders/${groupOrderId}/progress`,
          data: { groupOrderId, commandeOrderId, status, type: 'order-status' },
        })
      )
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    logger.info('order.status.notified', {
      groupOrderId,
      commandeOrderId,
      status,
      participants: participantIds.length,
      failed,
    });
  }
}
