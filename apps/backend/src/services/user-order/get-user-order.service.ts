/**
 * Get user order use case
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import type { UserOrder } from '@/schemas/user-order.schema';
import { NotFoundError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';

/**
 * Get user order use case
 */
@injectable()
export class GetUserOrderUseCase {
  private readonly userOrderRepository = inject(UserOrderRepository);

  async execute(orderId: string): Promise<UserOrder> {
    const userOrder = await this.userOrderRepository.findById(orderId);
    if (!userOrder) {
      throw new NotFoundError(`User order not found: ${orderId}`);
    }
    return userOrder;
  }
}
