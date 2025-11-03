/**
 * Create group order use case
 * @module application/use-cases/group-orders
 */

import { injectable } from 'tsyringe';
import { CreateGroupOrderRequestDto } from '@/application/dtos/group-order.dto';
import type { GroupOrder } from '@/domain/schemas/group-order.schema';
import type { UserId } from '@/domain/schemas/user.schema';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { ValidationError } from '@/utils/errors';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

/**
 * Create group order use case
 */
@injectable()
export class CreateGroupOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);

  async execute(leaderId: UserId, request: CreateGroupOrderRequestDto): Promise<GroupOrder> {
    const { startDate, endDate } = request;

    if (startDate >= endDate) {
      throw new ValidationError('End date must be after start date');
    }

    const groupOrder = await this.groupOrderRepository.create({
      name: request.name,
      leaderId,
      startDate,
      endDate,
    });

    logger.info('Group order created', {
      id: groupOrder.id,
      leaderId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return groupOrder;
  }
}
