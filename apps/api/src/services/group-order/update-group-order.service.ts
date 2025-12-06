/**
 * Update group order details use case
 * Allows group leaders to update order name, start date, and end date
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { type GroupOrderId } from '@/schemas/group-order.schema';
import type { UserId } from '@/schemas/user.schema';
import { ForbiddenError, NotFoundError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

export interface UpdateGroupOrderRequest {
  name?: string | null;
  startDate?: Date;
  endDate?: Date;
}

@injectable()
export class UpdateGroupOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);

  async execute(groupOrderId: GroupOrderId, requesterId: UserId, updates: UpdateGroupOrderRequest) {
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    if (groupOrder.leaderId !== requesterId) {
      throw new ForbiddenError();
    }

    // Validate that endDate is after startDate if both are provided
    if (updates.startDate && updates.endDate && updates.endDate <= updates.startDate) {
      throw new Error('End date must be after start date');
    }

    // If only one date is being updated, validate against the existing date
    if (updates.startDate && !updates.endDate && updates.startDate >= groupOrder.endDate) {
      throw new Error('Start date must be before end date');
    }

    if (updates.endDate && !updates.startDate && updates.endDate <= groupOrder.startDate) {
      throw new Error('End date must be after start date');
    }

    const updateData: Partial<{
      name: string | null;
      startDate: Date;
      endDate: Date;
    }> = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    if (updates.startDate !== undefined) {
      updateData.startDate = updates.startDate;
    }

    if (updates.endDate !== undefined) {
      updateData.endDate = updates.endDate;
    }

    const updatedGroupOrder = await this.groupOrderRepository.update(groupOrderId, updateData);

    logger.info('Group order details updated', {
      groupOrderId,
      updates: Object.keys(updateData),
    });

    return updatedGroupOrder;
  }
}
