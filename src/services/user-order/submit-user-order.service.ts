/**
 * Submit user order use case
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import type { GroupOrderId } from '@/schemas/group-order.schema';
import type { UserId } from '@/schemas/user.schema';
import { isUserOrderEmpty, type UserOrder } from '@/schemas/user-order.schema';
import { ResourceService } from '@/services/resource/resource.service';
import { GroupOrderStatus, UserOrderStatus } from '@/shared/types/types';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { validateItemAvailability } from '@/shared/utils/order-validation.utils';

/**
 * Submit user order use case
 */
@injectable()
export class SubmitUserOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly resourceService = inject(ResourceService);

  async execute(groupOrderId: GroupOrderId, userId: UserId): Promise<UserOrder> {
    // Get existing order
    const userOrder = await this.userOrderRepository.findByGroupAndUser(groupOrderId, userId);
    if (!userOrder) {
      throw new NotFoundError(
        `User order not found for user ${userId} in group order ${groupOrderId}`
      );
    }

    // Verify group order is still open
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${groupOrderId}`);
    }

    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      throw new ValidationError(
        `Cannot submit user order. Group order status: ${groupOrder.status}`
      );
    }

    // Validate that order is not empty
    if (isUserOrderEmpty(userOrder)) {
      throw new ValidationError('Cannot submit an empty order');
    }

    // Re-validate availability before submitting
    const stock = await this.resourceService.getStock();
    validateItemAvailability(userOrder.items, stock);

    // Update status
    return await this.userOrderRepository.updateStatus(
      groupOrderId,
      userId,
      UserOrderStatus.SUBMITTED
    );
  }
}
