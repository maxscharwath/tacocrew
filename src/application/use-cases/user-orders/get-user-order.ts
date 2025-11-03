/**
 * Get user order use case
 * @module application/use-cases/user-orders
 */

import { injectable } from 'tsyringe';
import type { GroupOrderId } from '@/domain/schemas/group-order.schema';
import type { UserId } from '@/domain/schemas/user.schema';
import type { UserOrder } from '@/domain/schemas/user-order.schema';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { NotFoundError } from '@/utils/errors';
import { inject } from '@/utils/inject';

/**
 * Get user order use case
 */
@injectable()
export class GetUserOrderUseCase {
  private readonly userOrderRepository = inject(UserOrderRepository);

  async execute(groupOrderId: GroupOrderId, userId: UserId): Promise<UserOrder> {
    const userOrder = await this.userOrderRepository.findByGroupAndUser(groupOrderId, userId);
    if (!userOrder) {
      throw new NotFoundError(
        `User order not found for user ${userId} in group order ${groupOrderId}`
      );
    }
    return userOrder;
  }
}
