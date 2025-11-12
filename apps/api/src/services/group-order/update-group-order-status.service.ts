/**
 * Update group order status use case
 * Allows group leaders to manually close or reopen an order before submission
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '../../infrastructure/repositories/group-order.repository';
import { type GroupOrderId } from '../../schemas/group-order.schema';
import type { UserId } from '../../schemas/user.schema';
import { GroupOrderStatus } from '../../shared/types/types';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/utils/errors.utils';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';

const toggleableStatuses = new Set<GroupOrderStatus>([
  GroupOrderStatus.OPEN,
  GroupOrderStatus.CLOSED,
]);

@injectable()
export class UpdateGroupOrderStatusUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);

  async execute(groupOrderId: GroupOrderId, requesterId: UserId, nextStatus: GroupOrderStatus) {
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    if (groupOrder.leaderId !== requesterId) {
      throw new ForbiddenError();
    }

    if (!toggleableStatuses.has(nextStatus)) {
      throw new ValidationError({ status: nextStatus });
    }

    if (!toggleableStatuses.has(groupOrder.status)) {
      throw new ValidationError({ status: groupOrder.status });
    }

    if (groupOrder.status === nextStatus) {
      return groupOrder;
    }

    const updatedGroupOrder = await this.groupOrderRepository.update(groupOrderId, {
      status: nextStatus,
    });

    logger.info('Group order status updated manually', {
      groupOrderId,
      previousStatus: groupOrder.status,
      nextStatus,
    });

    return updatedGroupOrder;
  }
}
