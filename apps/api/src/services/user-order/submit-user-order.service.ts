/**
 * Submit user order use case
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import type { UserId } from '@/schemas/user.schema';
import { isUserOrderEmpty, type UserOrder } from '@/schemas/user-order.schema';
import { ResourceService } from '@/services/resource/resource.service';
import { GroupOrderStatus } from '@/shared/types/types';
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

  async execute(orderId: string, userId: UserId): Promise<UserOrder> {
    // Get existing order
    const userOrder = await this.userOrderRepository.findById(orderId);
    if (!userOrder) {
      throw new NotFoundError({ resource: 'UserOrder', id: orderId });
    }

    // Verify user owns this order
    if (userOrder.userId !== userId) {
      throw new ValidationError({ message: 'You can only submit your own orders' });
    }

    // Verify group order is still open
    const groupOrder = await this.groupOrderRepository.findById(userOrder.groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: userOrder.groupOrderId });
    }

    if (groupOrder.status !== GroupOrderStatus.OPEN) {
      throw new ValidationError({
        message: `Cannot submit user order. Group order status: ${groupOrder.status}`,
      });
    }

    // Validate that order is not empty
    if (isUserOrderEmpty(userOrder)) {
      throw new ValidationError({ message: 'Cannot submit an empty order' });
    }

    // Re-validate availability before submitting
    const stock = await this.resourceService.getStock();
    validateItemAvailability(userOrder.items, stock);

    // Return the user order (status is managed by the group order)
    return userOrder;
  }
}
