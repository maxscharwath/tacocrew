/**
 * Delete user order use case
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { isGroupOrderLeader } from '@/schemas/group-order.schema';
import type { UserId } from '@/schemas/user.schema';
import { GroupOrderStatus } from '@/shared/types/types';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

/**
 * Delete user order use case
 * Users can delete their own orders, leaders can delete any order in their group
 */
@injectable()
export class DeleteUserOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);

  async execute(orderId: string, deleterUserId: UserId): Promise<void> {
    // Verify order exists
    const userOrder = await this.userOrderRepository.findById(orderId);
    if (!userOrder) {
      throw new NotFoundError(`User order not found: ${orderId}`);
    }

    // Check if user is deleting their own order or if deleter is the leader
    const groupOrder = await this.groupOrderRepository.findById(userOrder.groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${userOrder.groupOrderId}`);
    }

    const isLeader = isGroupOrderLeader(groupOrder, deleterUserId);
    const isOwnOrder = userOrder.userId === deleterUserId;

    if (!isLeader && !isOwnOrder) {
      throw new ValidationError('You can only delete your own order or be the leader');
    }

    // Can only delete if group order is still open
    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      throw new ValidationError(
        `Cannot delete user order. Group order status: ${groupOrder.status}`
      );
    }

    await this.userOrderRepository.delete(orderId);

    logger.info('User order deleted', {
      orderId,
      groupOrderId: userOrder.groupOrderId,
      userId: userOrder.userId,
      deletedBy: deleterUserId,
    });
  }
}
