/**
 * Create group order use case
 * @module services/group-order
 */

import { isAfter } from 'date-fns';
import { injectable } from 'tsyringe';
import type { CreateGroupOrderRequestDto } from '../../api/dto/group-order.dto';
import { OrganizationMemberStatus } from '../../generated/client';
import { GroupOrderRepository } from '../../infrastructure/repositories/group-order.repository';
import { OrganizationRepository } from '../../infrastructure/repositories/organization.repository';
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
  private readonly organizationRepository = inject(OrganizationRepository);

  async execute(leaderId: UserId, request: CreateGroupOrderRequestDto): Promise<GroupOrder> {
    const { startDate, endDate, organizationId: requestedOrganizationId } = request;

    if (!isAfter(endDate, startDate)) {
      throw new ValidationError({ message: 'End date must be after start date' });
    }

    // Get leader's organizations
    const leaderOrganizations = await this.organizationRepository.findByUserId(leaderId);
    // Filter to only ACTIVE memberships
    const activeOrganizations = leaderOrganizations.filter(
      (uo) => uo.status === OrganizationMemberStatus.ACTIVE
    );
    let organizationId: string | null = null;

    if (requestedOrganizationId) {
      // Validate that the user belongs to the requested organization (and is ACTIVE)
      const belongsToOrganization = activeOrganizations.some(
        (uo) => uo.organization.id === requestedOrganizationId
      );
      if (!belongsToOrganization) {
        throw new ValidationError({
          message: 'You must belong to the specified organization to create a group order for it',
        });
      }
      organizationId = requestedOrganizationId;
    } else {
      // No organization specified
      if (activeOrganizations.length === 0) {
        // User has no ACTIVE organizations - leave it null (backward compatibility)
        organizationId = null;
      } else if (activeOrganizations.length === 1) {
        // User has exactly one ACTIVE organization - use it automatically
        const firstOrg = activeOrganizations[0];
        if (firstOrg) {
          organizationId = firstOrg.organization.id;
        }
      } else {
        // User has multiple ACTIVE organizations - require them to specify
        throw new ValidationError({
          message:
            'You belong to multiple organizations. Please specify which organization this group order is for by providing organizationId',
        });
      }
    }

    const groupOrder = await this.groupOrderRepository.create({
      name: request.name,
      leaderId,
      startDate,
      endDate,
      organizationId,
    });

    logger.info('Group order created', {
      id: groupOrder.id,
      leaderId,
      organizationId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return groupOrder;
  }
}
