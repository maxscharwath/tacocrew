/**
 * Get group order with user orders use case
 * @module services/group-order
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import type { GroupOrder, GroupOrderId } from '@/schemas/group-order.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { NotFoundError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';

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
      throw new NotFoundError({ resource: 'GroupOrder', id });
    }

    const userOrders = await this.userOrderRepository.findByGroup(id);

    return { groupOrder, userOrders };
  }
}
