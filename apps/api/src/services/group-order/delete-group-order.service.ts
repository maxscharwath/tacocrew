/**
 * Delete group order use case
 * @module services/group-order/delete-group-order
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import type { GroupOrderId } from '@/schemas/group-order.schema';
import type { UserId } from '@/schemas/user.schema';
import { ForbiddenError, NotFoundError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

@injectable()
export class DeleteGroupOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);

  async execute(groupOrderId: GroupOrderId, requestingUserId: UserId): Promise<void> {
    logger.info('Deleting group order', { groupOrderId, requestingUserId });

    // Get the group order to verify it exists and check permissions
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);

    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    // Verify that the requesting user is the leader
    if (groupOrder.leaderId !== requestingUserId) {
      throw new ForbiddenError();
    }

    // Delete the group order (this will cascade delete all user orders)
    await this.groupOrderRepository.delete(groupOrderId);

    logger.info('Group order deleted successfully', { groupOrderId });
  }
}
