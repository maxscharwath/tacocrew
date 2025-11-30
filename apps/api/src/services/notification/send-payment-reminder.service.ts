/**
 * Send payment reminder service
 * Allows a group leader to send payment reminders to users
 * @module services/notification
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '../../infrastructure/repositories/group-order.repository';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UserOrderRepository } from '../../infrastructure/repositories/user-order.repository';
import { t } from '../../lib/i18n';
import type { GroupOrderId } from '../../schemas/group-order.schema';
import type { UserId } from '../../schemas/user.schema';
import type { UserOrderId } from '../../schemas/user-order.schema';
import { NotFoundError, ValidationError } from '../../shared/utils/errors.utils';
import { inject } from '../../shared/utils/inject.utils';
import { NotificationService } from './notification.service';

@injectable()
export class SendPaymentReminderService {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly userRepository = inject(UserRepository);
  private readonly notificationService = inject(NotificationService);

  async execute(
    groupOrderId: GroupOrderId,
    userOrderId: UserOrderId,
    requesterId: UserId
  ): Promise<{ success: boolean }> {
    // Fetch group order and user order in parallel
    const [groupOrder, userOrder] = await Promise.all([
      this.groupOrderRepository.findById(groupOrderId),
      this.userOrderRepository.findById(userOrderId),
    ]);

    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    if (!userOrder || userOrder.groupOrderId !== groupOrderId) {
      throw new NotFoundError({ resource: 'UserOrder', id: userOrderId });
    }

    // Only the leader can send payment reminders
    if (groupOrder.leaderId !== requesterId) {
      throw new ValidationError({ requesterId }, 'errors.notifications.paymentReminder.leaderOnly');
    }

    // Can't send reminder to yourself
    if (userOrder.userId === requesterId) {
      throw new ValidationError(
        { requesterId },
        'errors.notifications.paymentReminder.cannotRemindSelf'
      );
    }

    // Can't send reminder if already confirmed (settled)
    if (userOrder.reimbursement?.settled) {
      throw new ValidationError(
        { userOrderId },
        'errors.notifications.paymentReminder.alreadyConfirmed'
      );
    }

    // Get leader's name for the notification
    const leader = await this.userRepository.findById(requesterId);
    const leaderName = leader?.name || 'The group leader';

    // Get target user's language preference
    const userLanguage = await this.userRepository.getUserLanguage(userOrder.userId);

    // Send the notification
    await this.notificationService.sendToUser(userOrder.userId, {
      type: 'payment_reminder',
      title: t('notifications.paymentReminder.title', { lng: userLanguage }),
      body: t('notifications.paymentReminder.body', {
        lng: userLanguage,
        leaderName,
        orderName:
          groupOrder.name ||
          t('notifications.paymentReminder.defaultOrderName', { lng: userLanguage }),
      }),
      tag: `payment-reminder-${groupOrderId}-${userOrderId}`,
      url: `/orders/${groupOrderId}`,
      data: {
        groupOrderId,
        userOrderId,
        leaderName,
      },
    });

    return { success: true };
  }
}
