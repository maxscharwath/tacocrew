/**
 * Get group order use case
 * @module services/group-order
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import type { GroupOrder, GroupOrderId } from '@/schemas/group-order.schema';
import { NotFoundError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';

/**
 * Get group order use case
 */
@injectable()
export class GetGroupOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);

  async execute(id: GroupOrderId): Promise<GroupOrder> {
    const groupOrder = await this.groupOrderRepository.findById(id);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${id}`);
    }
    return groupOrder;
  }
}
