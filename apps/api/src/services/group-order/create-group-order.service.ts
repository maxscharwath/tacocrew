/**
 * Create group order use case
 * @module services/group-order
 */

import { isAfter } from 'date-fns';
import { injectable } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { OrganizationRepository } from '@/infrastructure/repositories/organization.repository';
import type { GroupOrder } from '@/schemas/group-order.schema';
import type { OrganizationId } from '@/schemas/organization.schema';
import type { UserId } from '@/schemas/user.schema';
import { BadgeEvaluationService } from '@/services/badge/badge-evaluation.service';
import { StatsTrackingService } from '@/services/badge/stats-tracking.service';
import { ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

/**
 * Create group order request (with parsed dates)
 */
export interface CreateGroupOrderRequest {
  name: string;
  startDate: Date;
  endDate: Date;
  organizationId: OrganizationId;
}

/**
 * Create group order use case
 */
@injectable()
export class CreateGroupOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly organizationRepository = inject(OrganizationRepository);
  private readonly statsTrackingService = inject(StatsTrackingService);
  private readonly badgeEvaluationService = inject(BadgeEvaluationService);

  async execute(leaderId: UserId, request: CreateGroupOrderRequest): Promise<GroupOrder> {
    this.validateDates(request.startDate, request.endDate);
    await this.validateOrganizationMembership(leaderId, request.organizationId);

    const groupOrder = await this.groupOrderRepository.create({
      name: request.name,
      leaderId,
      startDate: request.startDate,
      endDate: request.endDate,
      organizationId: request.organizationId,
    });

    logger.info('Group order created', {
      id: groupOrder.id,
      leaderId,
      organizationId: request.organizationId,
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
    });

    // Track stats and evaluate badges (non-blocking)
    this.trackGroupOrderCreation(leaderId, groupOrder.id).catch((error) => {
      logger.error('Failed to track group order creation for badges', { leaderId, error });
    });

    return groupOrder;
  }

  /**
   * Track group order creation for badges
   */
  private async trackGroupOrderCreation(leaderId: UserId, groupOrderId: string): Promise<void> {
    await this.statsTrackingService.trackGroupOrderCreated(leaderId);
    await this.badgeEvaluationService.evaluateAfterEvent(leaderId, {
      type: 'groupOrderCreated',
      userId: leaderId,
      timestamp: new Date(),
      data: { groupOrderId },
    });
  }

  private validateDates(startDate: Date, endDate: Date): void {
    if (!isAfter(endDate, startDate)) {
      throw new ValidationError({ message: 'End date must be after start date' });
    }
  }

  private async validateOrganizationMembership(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<void> {
    const membership = await this.organizationRepository.findActiveMembership(
      userId,
      organizationId
    );

    if (!membership) {
      throw new ValidationError({
        message: 'You must be an active member of the organization to create group orders',
      });
    }
  }
}
