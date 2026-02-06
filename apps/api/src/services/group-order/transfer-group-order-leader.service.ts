/**
 * Transfer group order leader use case
 * Allows the current leader to transfer leadership to another active organization member
 */

import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { type GroupOrder, type GroupOrderId } from '@/schemas/group-order.schema';
import { OrganizationId } from '@/schemas/organization.schema';
import { UserId } from '@/schemas/user.schema';
import { OrganizationService } from '@/services/organization/organization.service';
import { ForbiddenError, NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

@injectable()
export class TransferGroupOrderLeaderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly organizationService = inject(OrganizationService);

  async execute(
    groupOrderId: GroupOrderId,
    requesterId: UserId,
    newLeaderId: UserId
  ): Promise<GroupOrder> {
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    if (groupOrder.leaderId !== requesterId) {
      throw new ForbiddenError();
    }

    if (newLeaderId === requesterId) {
      throw new ValidationError({ message: 'Cannot transfer leadership to yourself' });
    }

    if (!groupOrder.organizationId) {
      throw new ValidationError({
        message: 'Cannot transfer leadership for orders without an organization',
      });
    }

    const parsedOrganizationId = OrganizationId.parse(groupOrder.organizationId);
    const isActiveMember = await this.organizationService.isUserActiveMember(
      newLeaderId,
      parsedOrganizationId
    );

    if (!isActiveMember) {
      throw new ValidationError({
        message: 'The new leader must be an active member of the organization',
      });
    }

    const updatedGroupOrder = await this.groupOrderRepository.update(groupOrderId, {
      leaderId: newLeaderId,
    });

    logger.info('Group order leader transferred', {
      groupOrderId,
      previousLeaderId: requesterId,
      newLeaderId,
    });

    return updatedGroupOrder;
  }
}
