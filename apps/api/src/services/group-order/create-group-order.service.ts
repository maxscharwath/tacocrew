/**
 * Create group order use case
 * @module services/group-order
 */

import { isAfter } from 'date-fns';
import { injectable } from 'tsyringe';
import type { CreateGroupOrderRequestDto } from '../../api/dto/group-order.dto';
import { GroupOrderRepository } from '../../infrastructure/repositories/group-order.repository';
import type { GroupOrder } from '../../schemas/group-order.schema';
import type { UserId } from '../../schemas/user.schema';
import { ValidationError } from '../../shared/utils/errors.utils';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';

/**
 * Create group order use case
 */
@injectable()
export class CreateGroupOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);

  async execute(leaderId: UserId, request: CreateGroupOrderRequestDto): Promise<GroupOrder> {
    const { startDate, endDate } = request;

    if (!isAfter(endDate, startDate)) {
      throw new ValidationError({ message: 'End date must be after start date' });
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
