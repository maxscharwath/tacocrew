/**
 * Tests for OrganizationService
 */

// Load test environment variables first
import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { OrganizationMemberStatus, OrganizationRole } from '@/generated/client';
import { OrganizationRepository } from '@/infrastructure/repositories/organization.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { createOrganizationFromDb } from '@/schemas/organization.schema';
import { NotificationService } from '@/services/notification/notification.service';
import { OrganizationService } from '@/services/organization/organization.service';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('OrganizationService', () => {
  const userId = randomUUID();
  const organizationId = randomUUID();
  const adminUserId = randomUUID();

  const mockOrganization = createOrganizationFromDb({
    id: organizationId,
    name: 'Test Organization',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockOrganizationRepository = {
    findById: mock(),
    findByUserId: mock(),
    create: mock(),
    addUserToOrganization: mock(),
    getUserMembership: mock(),
    getUserRole: mock(),
    isUserAdmin: mock(),
    listAll: mock(),
    updateImage: mock(),
    findAvatarById: mock(),
    getOrganizationMembers: mock(),
    getPendingRequests: mock(),
    updateUserStatus: mock(),
    updateUserRole: mock(),
    removeUserFromOrganization: mock(),
    update: mock(),
    delete: mock(),
  };

  const mockUserRepository = {
    findById: mock(),
  };

  const mockNotificationService = {
    sendToUser: mock(),
  };

  beforeEach(() => {
    container.clearInstances();

    Object.values(mockOrganizationRepository).forEach((m) => {
      if (typeof m === 'function' && 'mockReset' in m) {
        m.mockReset();
      }
    });
    Object.values(mockUserRepository).forEach((m) => {
      if (typeof m === 'function' && 'mockReset' in m) {
        m.mockReset();
      }
    });
    Object.values(mockNotificationService).forEach((m) => {
      if (typeof m === 'function' && 'mockReset' in m) {
        m.mockReset();
      }
    });

    container.registerInstance(
      OrganizationRepository,
      mockOrganizationRepository as unknown as OrganizationRepository
    );
    container.registerInstance(
      UserRepository,
      mockUserRepository as unknown as UserRepository
    );
    container.registerInstance(
      NotificationService,
      mockNotificationService as unknown as NotificationService
    );
  });

  describe('getOrganizationById', () => {
    it('should return organization when found', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);

      const service = container.resolve(OrganizationService);
      const result = await service.getOrganizationById(organizationId);

      expect(result).toEqual(mockOrganization);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(organizationId);
    });

    it('should return null when organization not found', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      const service = container.resolve(OrganizationService);
      const result = await service.getOrganizationById(organizationId);

      expect(result).toBeNull();
    });
  });

  describe('getUserOrganizations', () => {
    it('should return user organizations with role and status', async () => {
      const mockUserOrgs = [
        {
          organization: mockOrganization,
          role: OrganizationRole.ADMIN,
          status: OrganizationMemberStatus.ACTIVE,
        },
      ];
      mockOrganizationRepository.findByUserId.mockResolvedValue(mockUserOrgs);

      const service = container.resolve(OrganizationService);
      const result = await service.getUserOrganizations(userId);

      expect(result).toEqual(mockUserOrgs);
      expect(mockOrganizationRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('createOrganization', () => {
    it('should create organization and set creator as admin', async () => {
      mockOrganizationRepository.create.mockResolvedValue(mockOrganization);
      mockOrganizationRepository.addUserToOrganization.mockResolvedValue(undefined);

      const service = container.resolve(OrganizationService);
      const result = await service.createOrganization({ name: 'Test Organization' }, userId);

      expect(result).toEqual(mockOrganization);
      expect(mockOrganizationRepository.create).toHaveBeenCalledWith({
        name: 'Test Organization',
      });
      expect(mockOrganizationRepository.addUserToOrganization).toHaveBeenCalledWith(
        userId,
        organizationId,
        {
          role: OrganizationRole.ADMIN,
          status: OrganizationMemberStatus.ACTIVE,
        }
      );
    });
  });

  describe('addUserToOrganization', () => {
    it('should add user with ACTIVE status and send notification', async () => {
      mockOrganizationRepository.getUserMembership.mockResolvedValue(null);
      mockOrganizationRepository.addUserToOrganization.mockResolvedValue(undefined);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockNotificationService.sendToUser.mockResolvedValue(undefined);

      const service = container.resolve(OrganizationService);
      await service.addUserToOrganization(userId, organizationId, {
        role: OrganizationRole.MEMBER,
        status: OrganizationMemberStatus.ACTIVE,
      });

      expect(mockOrganizationRepository.addUserToOrganization).toHaveBeenCalledWith(
        userId,
        organizationId,
        {
          role: OrganizationRole.MEMBER,
          status: OrganizationMemberStatus.ACTIVE,
        }
      );
      expect(mockNotificationService.sendToUser).toHaveBeenCalled();
    });

    it('should not send notification if user was previously pending', async () => {
      mockOrganizationRepository.getUserMembership.mockResolvedValue({
        role: OrganizationRole.MEMBER,
        status: OrganizationMemberStatus.PENDING,
      });
      mockOrganizationRepository.addUserToOrganization.mockResolvedValue(undefined);

      const service = container.resolve(OrganizationService);
      await service.addUserToOrganization(userId, organizationId, {
        role: OrganizationRole.MEMBER,
        status: OrganizationMemberStatus.ACTIVE,
      });

      expect(mockNotificationService.sendToUser).not.toHaveBeenCalled();
    });
  });

  describe('requestToJoinOrganization', () => {
    it('should create pending membership and notify admins', async () => {
      mockOrganizationRepository.getUserMembership.mockResolvedValue(null);
      mockOrganizationRepository.addUserToOrganization.mockResolvedValue(undefined);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganizationRepository.getOrganizationMembers.mockResolvedValue([
        {
          userId: adminUserId,
          role: OrganizationRole.ADMIN,
          status: OrganizationMemberStatus.ACTIVE,
          user: {
            id: adminUserId,
            name: 'Admin User',
            email: 'admin@test.com',
            image: null,
            username: null,
          },
          createdAt: new Date(),
        },
      ]);
      mockUserRepository.findById.mockResolvedValue({
        id: userId,
        name: 'Test User',
        email: 'test@test.com',
      });
      mockNotificationService.sendToUser.mockResolvedValue(undefined);

      const service = container.resolve(OrganizationService);
      await service.requestToJoinOrganization(userId, organizationId);

      expect(mockOrganizationRepository.addUserToOrganization).toHaveBeenCalledWith(
        userId,
        organizationId,
        {
          role: OrganizationRole.MEMBER,
          status: OrganizationMemberStatus.PENDING,
        }
      );
      expect(mockNotificationService.sendToUser).toHaveBeenCalled();
    });

    it('should throw error if user is already a member', async () => {
      mockOrganizationRepository.getUserMembership.mockResolvedValue({
        role: OrganizationRole.MEMBER,
        status: OrganizationMemberStatus.ACTIVE,
      });

      const service = container.resolve(OrganizationService);
      await expect(
        service.requestToJoinOrganization(userId, organizationId)
      ).rejects.toThrow('You are already a member of this organization');
    });

    it('should throw error if user already has pending request', async () => {
      mockOrganizationRepository.getUserMembership.mockResolvedValue({
        role: OrganizationRole.MEMBER,
        status: OrganizationMemberStatus.PENDING,
      });

      const service = container.resolve(OrganizationService);
      await expect(
        service.requestToJoinOrganization(userId, organizationId)
      ).rejects.toThrow('You already have a pending join request for this organization');
    });
  });

  describe('acceptJoinRequest', () => {
    it('should accept join request and send notification', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(true);
      mockOrganizationRepository.updateUserStatus.mockResolvedValue(undefined);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockNotificationService.sendToUser.mockResolvedValue(undefined);

      const service = container.resolve(OrganizationService);
      await service.acceptJoinRequest(adminUserId, userId, organizationId);

      expect(mockOrganizationRepository.isUserAdmin).toHaveBeenCalledWith(
        adminUserId,
        organizationId
      );
      expect(mockOrganizationRepository.updateUserStatus).toHaveBeenCalledWith(
        userId,
        organizationId,
        OrganizationMemberStatus.ACTIVE
      );
      expect(mockNotificationService.sendToUser).toHaveBeenCalled();
    });

    it('should throw error if user is not admin', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(false);

      const service = container.resolve(OrganizationService);
      await expect(
        service.acceptJoinRequest(adminUserId, userId, organizationId)
      ).rejects.toThrow('Only admins can accept join requests');
    });
  });

  describe('rejectJoinRequest', () => {
    it('should reject join request and send notification', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(true);
      mockOrganizationRepository.removeUserFromOrganization.mockResolvedValue(undefined);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockNotificationService.sendToUser.mockResolvedValue(undefined);

      const service = container.resolve(OrganizationService);
      await service.rejectJoinRequest(adminUserId, userId, organizationId);

      expect(mockOrganizationRepository.isUserAdmin).toHaveBeenCalledWith(
        adminUserId,
        organizationId
      );
      expect(mockOrganizationRepository.removeUserFromOrganization).toHaveBeenCalledWith(
        userId,
        organizationId
      );
      expect(mockNotificationService.sendToUser).toHaveBeenCalled();
    });

    it('should throw error if user is not admin', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(false);

      const service = container.resolve(OrganizationService);
      await expect(
        service.rejectJoinRequest(adminUserId, userId, organizationId)
      ).rejects.toThrow('Only admins can reject join requests');
    });
  });

  describe('removeUserFromOrganization', () => {
    it('should remove user and send notification', async () => {
      mockOrganizationRepository.removeUserFromOrganization.mockResolvedValue(undefined);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockNotificationService.sendToUser.mockResolvedValue(undefined);

      const service = container.resolve(OrganizationService);
      await service.removeUserFromOrganization(userId, organizationId);

      expect(mockOrganizationRepository.removeUserFromOrganization).toHaveBeenCalledWith(
        userId,
        organizationId
      );
      expect(mockNotificationService.sendToUser).toHaveBeenCalled();
    });
  });

  describe('updateOrganization', () => {
    it('should update organization when user is admin', async () => {
      const updatedOrg = createOrganizationFromDb({
        ...mockOrganization,
        name: 'Updated Organization',
      });
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(true);
      mockOrganizationRepository.update.mockResolvedValue(updatedOrg);

      const service = container.resolve(OrganizationService);
      const result = await service.updateOrganization(
        organizationId,
        { name: 'Updated Organization' },
        adminUserId
      );

      expect(result).toEqual(updatedOrg);
      expect(mockOrganizationRepository.isUserAdmin).toHaveBeenCalledWith(
        adminUserId,
        organizationId
      );
      expect(mockOrganizationRepository.update).toHaveBeenCalledWith(organizationId, {
        name: 'Updated Organization',
      });
    });

    it('should throw error if user is not admin', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(false);

      const service = container.resolve(OrganizationService);
      await expect(
        service.updateOrganization(organizationId, { name: 'Updated' }, adminUserId)
      ).rejects.toThrow('Only admins can update organizations');
    });

    it('should throw error if organization not found', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(true);
      mockOrganizationRepository.update.mockResolvedValue(null);

      const service = container.resolve(OrganizationService);
      await expect(
        service.updateOrganization(organizationId, { name: 'Updated' }, adminUserId)
      ).rejects.toThrow(`Organization not found: ${organizationId}`);
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization when user is admin', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(true);
      mockOrganizationRepository.delete.mockResolvedValue(undefined);

      const service = container.resolve(OrganizationService);
      await service.deleteOrganization(organizationId, adminUserId);

      expect(mockOrganizationRepository.isUserAdmin).toHaveBeenCalledWith(
        adminUserId,
        organizationId
      );
      expect(mockOrganizationRepository.delete).toHaveBeenCalledWith(organizationId);
    });

    it('should throw error if user is not admin', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(false);

      const service = container.resolve(OrganizationService);
      await expect(
        service.deleteOrganization(organizationId, adminUserId)
      ).rejects.toThrow('Only admins can delete organizations');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role and send notification', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(true);
      mockOrganizationRepository.updateUserRole.mockResolvedValue(undefined);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockNotificationService.sendToUser.mockResolvedValue(undefined);

      const service = container.resolve(OrganizationService);
      await service.updateUserRole(userId, organizationId, OrganizationRole.ADMIN, adminUserId);

      expect(mockOrganizationRepository.isUserAdmin).toHaveBeenCalledWith(
        adminUserId,
        organizationId
      );
      expect(mockOrganizationRepository.updateUserRole).toHaveBeenCalledWith(
        userId,
        organizationId,
        OrganizationRole.ADMIN
      );
      expect(mockNotificationService.sendToUser).toHaveBeenCalled();
    });

    it('should throw error if user is not admin', async () => {
      mockOrganizationRepository.isUserAdmin.mockResolvedValue(false);

      const service = container.resolve(OrganizationService);
      await expect(
        service.updateUserRole(userId, organizationId, OrganizationRole.ADMIN, adminUserId)
      ).rejects.toThrow('Only admins can update user roles');
    });
  });

  describe('isUserActiveMember', () => {
    it('should return true if user is active member', async () => {
      mockOrganizationRepository.getUserMembership.mockResolvedValue({
        role: OrganizationRole.MEMBER,
        status: OrganizationMemberStatus.ACTIVE,
      });

      const service = container.resolve(OrganizationService);
      const result = await service.isUserActiveMember(userId, organizationId);

      expect(result).toBe(true);
    });

    it('should return false if user is not active member', async () => {
      mockOrganizationRepository.getUserMembership.mockResolvedValue({
        role: OrganizationRole.MEMBER,
        status: OrganizationMemberStatus.PENDING,
      });

      const service = container.resolve(OrganizationService);
      const result = await service.isUserActiveMember(userId, organizationId);

      expect(result).toBe(false);
    });

    it('should return false if user has no membership', async () => {
      mockOrganizationRepository.getUserMembership.mockResolvedValue(null);

      const service = container.resolve(OrganizationService);
      const result = await service.isUserActiveMember(userId, organizationId);

      expect(result).toBe(false);
    });
  });
});
