/**
 * Get group order use case
 * @module application/use-cases/group-orders
 */

import { injectable } from 'tsyringe';
import type { GroupOrder, GroupOrderId } from '@/domain/schemas/group-order.schema';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { NotFoundError } from '@/utils/errors';
import { inject } from '@/utils/inject';

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
