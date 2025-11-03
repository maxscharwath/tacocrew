/**
 * Get group order with user orders use case
 * @module application/use-cases/group-orders
 */

import { injectable } from 'tsyringe';
import type { GroupOrder, GroupOrderId } from '@/domain/schemas/group-order.schema';
import type { UserOrder } from '@/domain/schemas/user-order.schema';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { NotFoundError } from '@/utils/errors';
import { inject } from '@/utils/inject';

/**
 * Get group order with user orders use case
 */
@injectable()
export class GetGroupOrderWithUserOrdersUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);

  async execute(id: GroupOrderId): Promise<{ groupOrder: GroupOrder; userOrders: UserOrder[] }> {
    const groupOrder = await this.groupOrderRepository.findById(id);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${id}`);
    }

    const userOrders = await this.userOrderRepository.findByGroup(id);

    return { groupOrder, userOrders };
  }
}
