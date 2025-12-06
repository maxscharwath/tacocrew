/**
 * Organization repository
 * @module infrastructure/repositories/organization
 */

import { injectable } from 'tsyringe';
import { OrganizationMemberStatus, OrganizationRole } from '@/generated/client';
import {
  createOrganizationFromDb,
  type Organization,
  type OrganizationId,
} from '@/schemas/organization.schema';
import type { UserId } from '@/schemas/user.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { PrismaService } from '@/infrastructure/database/prisma.service';

export interface MembershipOptions {
  role?: OrganizationRole;
  status?: OrganizationMemberStatus;
}

/**
 * Organization repository
 */
@injectable()
export class OrganizationRepository {
  private readonly prisma = inject(PrismaService);

  async findById(id: OrganizationId): Promise<Organization | null> {
    try {
      const dbOrganization = await this.prisma.client.organization.findUnique({
        where: { id },
      });

      return dbOrganization ? createOrganizationFromDb(dbOrganization) : null;
    } catch (error) {
      logger.error('Failed to find organization by id', { id, error });
      return null;
    }
  }

  async findByUserId(userId: UserId): Promise<
    Array<{
      organization: Organization;
      role: OrganizationRole;
      status: OrganizationMemberStatus;
    }>
  > {
    try {
      const userOrganizations = await this.prisma.client.userOrganization.findMany({
        where: {
          userId,
        },
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return userOrganizations.map((uo) => ({
        organization: createOrganizationFromDb(uo.organization),
        role: uo.role,
        status: uo.status,
      }));
    } catch (error) {
      logger.error('Failed to find organizations by user id', { userId, error });
      return [];
    }
  }

  async create(data: { name: string }): Promise<Organization> {
    try {
      const dbOrganization = await this.prisma.client.organization.create({
        data: {
          name: data.name,
        },
      });

      logger.debug('Organization created', { id: dbOrganization.id });
      return createOrganizationFromDb(dbOrganization);
    } catch (error) {
      logger.error('Failed to create organization', { error });
      throw error;
    }
  }

  async addUserToOrganization(
    userId: UserId,
    organizationId: OrganizationId,
    options?: MembershipOptions
  ): Promise<void> {
    try {
      const role = options?.role ?? OrganizationRole.MEMBER;
      const status = options?.status ?? OrganizationMemberStatus.PENDING;

      await this.prisma.client.userOrganization.upsert({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        create: {
          userId,
          organizationId,
          role,
          status,
        },
        update: {
          role,
          status,
        },
      });

      logger.debug('User added to organization', { userId, organizationId, role, status });
    } catch (error) {
      logger.error('Failed to add user to organization', { userId, organizationId, error });
      throw error;
    }
  }

  async getUserMembership(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<{ role: OrganizationRole; status: OrganizationMemberStatus } | null> {
    try {
      const membership = await this.prisma.client.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: {
          role: true,
          status: true,
        },
      });

      return membership ? { role: membership.role, status: membership.status } : null;
    } catch (error) {
      logger.error('Failed to get user membership', { userId, organizationId, error });
      return null;
    }
  }

  async getUserRole(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<OrganizationRole | null> {
    try {
      const membership = await this.prisma.client.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: {
          role: true,
        },
      });

      return membership?.role ?? null;
    } catch (error) {
      logger.error('Failed to get user role', { userId, organizationId, error });
      return null;
    }
  }

  async isUserAdmin(userId: UserId, organizationId: OrganizationId): Promise<boolean> {
    try {
      const membership = await this.prisma.client.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: {
          role: true,
          status: true,
        },
      });

      return (
        membership?.role === OrganizationRole.ADMIN &&
        membership?.status === OrganizationMemberStatus.ACTIVE
      );
    } catch (error) {
      logger.error('Failed to check if user is admin', { userId, organizationId, error });
      return false;
    }
  }

  async updateUserRole(
    userId: UserId,
    organizationId: OrganizationId,
    role: OrganizationRole
  ): Promise<void> {
    try {
      await this.prisma.client.userOrganization.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: {
          role,
        },
      });

      logger.debug('User role updated', { userId, organizationId, role });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new Error('User is not a member of this organization');
      }
      logger.error('Failed to update user role', { userId, organizationId, role, error });
      throw error;
    }
  }

  async updateUserStatus(
    userId: UserId,
    organizationId: OrganizationId,
    status: OrganizationMemberStatus
  ): Promise<void> {
    try {
      await this.prisma.client.userOrganization.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: {
          status,
        },
      });

      logger.debug('User status updated', { userId, organizationId, status });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new Error('User is not a member of this organization');
      }
      logger.error('Failed to update user status', { userId, organizationId, status, error });
      throw error;
    }
  }

  async getOrganizationMembers(organizationId: OrganizationId): Promise<
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
    try {
      const members = await this.prisma.client.userOrganization.findMany({
        where: {
          organizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' }, // Admins first
          { createdAt: 'asc' },
        ],
      });

      return members.map((m) => ({
        userId: m.userId,
        role: m.role,
        status: m.status,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          username: m.user.username,
        },
        createdAt: m.createdAt,
      }));
    } catch (error) {
      logger.error('Failed to get organization members', { organizationId, error });
      return [];
    }
  }

  async getPendingRequests(organizationId: OrganizationId): Promise<
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
    try {
      const pending = await this.prisma.client.userOrganization.findMany({
        where: {
          organizationId,
          status: OrganizationMemberStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return pending.map((m) => ({
        userId: m.userId,
        role: m.role,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          username: m.user.username,
        },
        createdAt: m.createdAt,
      }));
    } catch (error) {
      logger.error('Failed to get pending requests', { organizationId, error });
      return [];
    }
  }

  async removeUserFromOrganization(userId: UserId, organizationId: OrganizationId): Promise<void> {
    try {
      await this.prisma.client.userOrganization.delete({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
      });

      logger.debug('User removed from organization', { userId, organizationId });
    } catch (error) {
      logger.error('Failed to remove user from organization', { userId, organizationId, error });
      throw error;
    }
  }

  async listAll(): Promise<Organization[]> {
    try {
      const dbOrganizations = await this.prisma.client.organization.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return dbOrganizations.map(createOrganizationFromDb);
    } catch (error) {
      logger.error('Failed to list organizations', { error });
      return [];
    }
  }

  async updateImage(
    organizationId: OrganizationId,
    image: Buffer | null
  ): Promise<Organization | null> {
    try {
      const storedImage = image ? image.toString('base64') : null;
      const dbOrganization = await this.prisma.client.organization.update({
        where: { id: organizationId },
        data: { image: storedImage },
      });
      return createOrganizationFromDb(dbOrganization);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return null;
      }
      logger.error('Failed to update organization image', { organizationId, error });
      return null;
    }
  }

  async findAvatarById(
    organizationId: OrganizationId
  ): Promise<{ image: Buffer; updatedAt: Date | null } | null> {
    const dbOrganization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: {
        image: true,
        updatedAt: true,
      },
    });

    if (!dbOrganization?.image) {
      return null;
    }

    return {
      image: Buffer.from(dbOrganization.image, 'base64'),
      updatedAt: dbOrganization.updatedAt,
    };
  }
}
