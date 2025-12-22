/**
 * Organization service
 * @module services/organization
 */

import { injectable } from 'tsyringe';
import { OrganizationMemberStatus, OrganizationRole } from '@/generated/client';
import {
  type MembershipOptions,
  OrganizationRepository,
} from '@/infrastructure/repositories/organization.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { t } from '@/lib/i18n';
import type { Organization, OrganizationId } from '@/schemas/organization.schema';
import { UserId } from '@/schemas/user.schema';
import { BadgeEvaluationService } from '@/services/badge/badge-evaluation.service';
import { StatsTrackingService } from '@/services/badge/stats-tracking.service';
import { NotificationService } from '@/services/notification/notification.service';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

/**
 * Organization service
 */
@injectable()
export class OrganizationService {
  private readonly organizationRepository = inject(OrganizationRepository);
  private readonly userRepository = inject(UserRepository);
  private readonly notificationService = inject(NotificationService);
  private readonly statsTrackingService = inject(StatsTrackingService);
  private readonly badgeEvaluationService = inject(BadgeEvaluationService);

  getOrganizationById(organizationId: OrganizationId): Promise<Organization | null> {
    return this.organizationRepository.findById(organizationId);
  }

  getUserOrganizations(userId: UserId): Promise<
    Array<{
      organization: Organization;
      role: OrganizationRole;
      status: OrganizationMemberStatus;
    }>
  > {
    return this.organizationRepository.findByUserId(userId);
  }

  async createOrganization(
    data: { name: string },
    creatorId: UserId,
    image?: Buffer | null
  ): Promise<Organization> {
    const organization = await this.organizationRepository.create(data, image);
    // Set creator as ADMIN with ACTIVE status
    await this.organizationRepository.addUserToOrganization(creatorId, organization.id, {
      role: OrganizationRole.ADMIN,
      status: OrganizationMemberStatus.ACTIVE,
    });

    // Track badge progress (non-blocking)
    this.trackOrganizationCreated(creatorId, organization.id).catch((error) => {
      logger.debug('Failed to track organization creation for badges', { creatorId, error });
    });

    return organization;
  }

  async addUserToOrganization(
    userId: UserId,
    organizationId: OrganizationId,
    options?: MembershipOptions
  ): Promise<void> {
    // Check if user already has a membership
    const existingMembership = await this.organizationRepository.findMembership(
      userId,
      organizationId
    );
    const wasPending = existingMembership?.status === OrganizationMemberStatus.PENDING;

    await this.organizationRepository.addUserToOrganization(userId, organizationId, options);

    // If user is being added with ACTIVE status and wasn't previously pending (i.e., manually added by admin),
    // send notification. If they were pending, acceptJoinRequest should be used instead which already sends notification.
    if (options?.status === OrganizationMemberStatus.ACTIVE && !wasPending) {
      try {
        const organization = await this.organizationRepository.findById(organizationId);
        await this.notificationService.sendToUser(userId, {
          type: 'organization_join_accepted',
          title: t('notifications.organization.joinAccepted.title'),
          body: t('notifications.organization.joinAccepted.body', {
            organizationName: organization?.name || 'the organization',
          }),
          tag: `join-accepted-${organizationId}-${userId}`,
          url: `/profile/organizations?org=${organizationId}`,
          data: {
            organizationId,
            type: 'join_accepted',
          },
        });
      } catch (error) {
        logger.debug('Failed to send join accepted notification', {
          userId,
          organizationId,
          error,
        });
      }

      // Track badge progress (non-blocking)
      this.trackOrganizationJoined(userId, organizationId).catch((error) => {
        logger.debug('Failed to track organization join for badges', { userId, error });
      });
    }
  }

  async requestToJoinOrganization(userId: UserId, organizationId: OrganizationId): Promise<void> {
    // Check if user is already a member or has a pending request
    const membership = await this.organizationRepository.findMembership(userId, organizationId);

    if (membership) {
      if (membership.status === OrganizationMemberStatus.ACTIVE) {
        throw new Error('You are already a member of this organization');
      }
      if (membership.status === OrganizationMemberStatus.PENDING) {
        throw new Error('You already have a pending join request for this organization');
      }
    }

    // User requests to join - creates PENDING membership
    await this.organizationRepository.addUserToOrganization(userId, organizationId, {
      role: OrganizationRole.MEMBER,
      status: OrganizationMemberStatus.PENDING,
    });

    // Notify organization admins about the join request
    try {
      const organization = await this.organizationRepository.findById(organizationId);
      const members = await this.organizationRepository.getOrganizationMembers(organizationId);
      const admins = members.filter(
        (m) => m.role === OrganizationRole.ADMIN && m.status === OrganizationMemberStatus.ACTIVE
      );
      const user = await this.userRepository.findById(userId);
      const userName = user?.name || 'A user';

      const notificationPromises = admins.map(async (admin) => {
        try {
          const adminUserId = UserId.parse(admin.userId);
          await this.notificationService.sendToUser(adminUserId, {
            type: 'organization_join_request',
            title: t('notifications.organization.joinRequest.title'),
            body: t('notifications.organization.joinRequest.body', {
              userName,
              organizationName: organization?.name || 'the organization',
            }),
            tag: `join-request-${organizationId}-${userId}`,
            url: `/profile/organizations?org=${organizationId}`,
            data: {
              organizationId,
              userId,
              type: 'join_request',
            },
          });
        } catch (error) {
          logger.debug('Failed to send join request notification to admin', {
            adminId: admin.userId,
            error,
          });
        }
      });

      await Promise.allSettled(notificationPromises);
    } catch (error) {
      logger.debug('Failed to send join request notifications', { userId, organizationId, error });
    }
  }

  async acceptJoinRequest(
    adminUserId: UserId,
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<void> {
    // Verify admin has permission
    const isAdmin = await this.isUserAdmin(adminUserId, organizationId);
    if (!isAdmin) {
      throw new Error('Only admins can accept join requests');
    }
    // Update status to ACTIVE
    await this.organizationRepository.updateUserStatus(
      userId,
      organizationId,
      OrganizationMemberStatus.ACTIVE
    );

    // Notify the user that their join request was accepted
    try {
      const organization = await this.organizationRepository.findById(organizationId);
      await this.notificationService.sendToUser(userId, {
        type: 'organization_join_accepted',
        title: t('notifications.organization.joinAccepted.title'),
        body: t('notifications.organization.joinAccepted.body', {
          organizationName: organization?.name || 'the organization',
        }),
        tag: `join-accepted-${organizationId}-${userId}`,
        url: `/profile/organizations?org=${organizationId}`,
        data: {
          organizationId,
          type: 'join_accepted',
        },
      });
    } catch (error) {
      logger.debug('Failed to send join accepted notification', { userId, organizationId, error });
    }

    // Track badge progress (non-blocking)
    this.trackOrganizationJoined(userId, organizationId).catch((error) => {
      logger.debug('Failed to track organization join for badges', { userId, error });
    });
  }

  async rejectJoinRequest(
    adminUserId: UserId,
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<void> {
    // Verify admin has permission
    const isAdmin = await this.isUserAdmin(adminUserId, organizationId);
    if (!isAdmin) {
      throw new Error('Only admins can reject join requests');
    }
    // Remove the membership
    await this.organizationRepository.removeUserFromOrganization(userId, organizationId);

    // Notify the user that their join request was rejected
    try {
      const organization = await this.organizationRepository.findById(organizationId);
      await this.notificationService.sendToUser(userId, {
        type: 'organization_join_rejected',
        title: t('notifications.organization.joinRejected.title'),
        body: t('notifications.organization.joinRejected.body', {
          organizationName: organization?.name || 'the organization',
        }),
        tag: `join-rejected-${organizationId}-${userId}`,
        url: `/profile/organizations`,
        data: {
          organizationId,
          type: 'join_rejected',
        },
      });
    } catch (error) {
      logger.debug('Failed to send join rejected notification', { userId, organizationId, error });
    }
  }

  async removeUserFromOrganization(userId: UserId, organizationId: OrganizationId): Promise<void> {
    await this.organizationRepository.removeUserFromOrganization(userId, organizationId);

    // Notify the user that they were removed from the organization
    try {
      const organization = await this.organizationRepository.findById(organizationId);
      await this.notificationService.sendToUser(userId, {
        type: 'organization_member_removed',
        title: t('notifications.organization.memberRemoved.title'),
        body: t('notifications.organization.memberRemoved.body', {
          organizationName: organization?.name || 'the organization',
        }),
        tag: `member-removed-${organizationId}-${userId}`,
        url: `/profile/organizations`,
        data: {
          organizationId,
          type: 'member_removed',
        },
      });
    } catch (error) {
      logger.debug('Failed to send member removed notification', { userId, organizationId, error });
    }
  }

  listAllOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.listAll();
  }

  async updateOrganizationImage(
    organizationId: OrganizationId,
    image: Buffer | null
  ): Promise<Organization> {
    const updatedOrganization = await this.organizationRepository.updateImage(
      organizationId,
      image
    );
    if (!updatedOrganization) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    return updatedOrganization;
  }

  getOrganizationAvatar(
    organizationId: OrganizationId
  ): Promise<{ image: Buffer; updatedAt: Date | null } | null> {
    return this.organizationRepository.findAvatarById(organizationId);
  }

  getUserRole(userId: UserId, organizationId: OrganizationId): Promise<OrganizationRole | null> {
    return this.organizationRepository.getUserRole(userId, organizationId);
  }

  findMembership(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<{
    role: OrganizationRole;
    status: OrganizationMemberStatus;
  } | null> {
    return this.organizationRepository.findMembership(userId, organizationId);
  }

  isUserAdmin(userId: UserId, organizationId: OrganizationId): Promise<boolean> {
    return this.organizationRepository.isUserAdmin(userId, organizationId);
  }

  /**
   * Check if user is an active member of the organization
   * Returns true if user is an active member, false otherwise
   */
  async isUserActiveMember(userId: UserId, organizationId: OrganizationId): Promise<boolean> {
    const membership = await this.organizationRepository.findMembership(userId, organizationId);
    return membership?.status === OrganizationMemberStatus.ACTIVE;
  }

  async updateUserRole(
    userId: UserId,
    organizationId: OrganizationId,
    role: OrganizationRole,
    adminUserId: UserId
  ): Promise<void> {
    // Verify admin has permission
    const isAdmin = await this.isUserAdmin(adminUserId, organizationId);
    if (!isAdmin) {
      throw new Error('Only admins can update user roles');
    }
    await this.organizationRepository.updateUserRole(userId, organizationId, role);

    // Notify the user that their role was updated
    try {
      const organization = await this.organizationRepository.findById(organizationId);
      await this.notificationService.sendToUser(userId, {
        type: 'organization_role_updated',
        title: t('notifications.organization.roleUpdated.title'),
        body: (lng: string) => {
          const roleName =
            role === OrganizationRole.ADMIN
              ? t('organizations.roles.admin', { lng })
              : t('organizations.roles.member', { lng });
          return t('notifications.organization.roleUpdated.body', {
            lng,
            organizationName: organization?.name || 'the organization',
            role: roleName,
          }) as string;
        },
        tag: `role-updated-${organizationId}-${userId}`,
        url: `/profile/organizations?org=${organizationId}`,
        data: {
          organizationId,
          role,
          type: 'role_updated',
        },
      });
    } catch (error) {
      logger.debug('Failed to send role updated notification', { userId, organizationId, error });
    }
  }

  async updateUserStatus(
    userId: UserId,
    organizationId: OrganizationId,
    status: OrganizationMemberStatus
  ): Promise<void> {
    await this.organizationRepository.updateUserStatus(userId, organizationId, status);
  }

  getOrganizationMembers(organizationId: OrganizationId): Promise<
    Array<{
      userId: string;
      role: OrganizationRole;
      status: OrganizationMemberStatus;
      user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
        username: string | null;
      };
      createdAt: Date;
    }>
  > {
    return this.organizationRepository.getOrganizationMembers(organizationId);
  }

  getPendingRequests(organizationId: OrganizationId): Promise<
    Array<{
      userId: string;
      role: OrganizationRole;
      user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
        username: string | null;
      };
      createdAt: Date;
    }>
  > {
    return this.organizationRepository.getPendingRequests(organizationId);
  }

  async updateOrganization(
    organizationId: OrganizationId,
    data: { name: string },
    adminUserId: UserId
  ): Promise<Organization> {
    // Verify admin has permission
    const isAdmin = await this.isUserAdmin(adminUserId, organizationId);
    if (!isAdmin) {
      throw new Error('Only admins can update organizations');
    }

    const updatedOrganization = await this.organizationRepository.update(organizationId, data);
    if (!updatedOrganization) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    return updatedOrganization;
  }

  async deleteOrganization(organizationId: OrganizationId, adminUserId: UserId): Promise<void> {
    // Verify admin has permission
    const isAdmin = await this.isUserAdmin(adminUserId, organizationId);
    if (!isAdmin) {
      throw new Error('Only admins can delete organizations');
    }

    await this.organizationRepository.delete(organizationId);
  }

  /**
   * Track organization creation for badges
   */
  private async trackOrganizationCreated(
    creatorId: UserId,
    organizationId: OrganizationId
  ): Promise<void> {
    await this.statsTrackingService.trackOrganizationCreated(creatorId);
    await this.badgeEvaluationService.evaluateAfterEvent(creatorId, {
      type: 'organizationCreated',
      userId: creatorId,
      timestamp: new Date(),
      data: { organizationId },
    });
  }

  /**
   * Track organization join for badges
   */
  private async trackOrganizationJoined(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<void> {
    await this.statsTrackingService.trackOrganizationJoined(userId);
    await this.badgeEvaluationService.evaluateAfterEvent(userId, {
      type: 'organizationJoined',
      userId,
      timestamp: new Date(),
      data: { organizationId },
    });
  }
}
