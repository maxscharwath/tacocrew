/**
 * Unit tests for username header authentication method
 */

import type { Context } from 'hono';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usernameHeaderAuth } from '@/api/middleware/auth-methods/username-header.auth';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import type { User, UserId } from '@/schemas/user.schema';
import { UnauthorizedError } from '@/shared/utils/errors.utils';
import { createMockUserRepository } from '../../mocks';

describe('usernameHeaderAuth', () => {
  let mockContext: Context;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  const mockUserId = 'user-123' as UserId;

  const createMockUser = (overrides?: Partial<User>): User => ({
    id: mockUserId,
    username: 'testuser',
    slackId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    container.clearInstances();

    // Create mock context
    mockContext = {
      req: {
        header: vi.fn(),
      },
    } as unknown as Context;

    // Create and register mock user repository
    mockUserRepository = createMockUserRepository();
    container.registerInstance(UserRepository, mockUserRepository as unknown as UserRepository);
  });

  describe('successful authentication', () => {
    it('should authenticate with existing user', async () => {
      const username = 'existinguser';
      const user = createMockUser({ username });

      vi.mocked(mockContext.req.header).mockReturnValue(username);
      mockUserRepository.findByUsername.mockResolvedValue(user);

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(mockUserId);
      expect(result.username).toBe(username);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should create and authenticate new user when not found', async () => {
      const username = 'newuser';
      const user = createMockUser({ username });

      vi.mocked(mockContext.req.header).mockReturnValue(username);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(user);

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(mockUserId);
      expect(result.username).toBe(username);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username);
      expect(mockUserRepository.create).toHaveBeenCalledWith({ username });
    });

    it('should handle user with slackId', async () => {
      const username = 'slackuser';
      const user = createMockUser({ username, slackId: 'slack-123' });

      vi.mocked(mockContext.req.header).mockReturnValue(username);
      mockUserRepository.findByUsername.mockResolvedValue(user);

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(true);
      expect(result.slackId).toBe('slack-123');
    });

    it('should trim whitespace from username', async () => {
      const username = '  spaceduser  ';
      const trimmedUsername = 'spaceduser';
      const user = createMockUser({ username: trimmedUsername });

      vi.mocked(mockContext.req.header).mockReturnValue(username);
      mockUserRepository.findByUsername.mockResolvedValue(user);

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(true);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(trimmedUsername);
    });
  });

  describe('failure cases', () => {
    it('should return failure when no x-username header', async () => {
      vi.mocked(mockContext.req.header).mockReturnValue(undefined);

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(false);
      expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should return failure when x-username header is empty string', async () => {
      vi.mocked(mockContext.req.header).mockReturnValue('');

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(false);
      expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
    });

    it('should return failure when x-username header is only whitespace', async () => {
      vi.mocked(mockContext.req.header).mockReturnValue('   ');

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(false);
      expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
    });

    it('should return failure when username is too short', async () => {
      vi.mocked(mockContext.req.header).mockReturnValue('a');

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
      expect(result.error?.message).toBe('x-username header must be at least 2 characters long');
      expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
    });

    it('should return failure when username is exactly 1 character', async () => {
      vi.mocked(mockContext.req.header).mockReturnValue('x');

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
    });

    it('should accept username with exactly 2 characters', async () => {
      const username = 'ab';
      const user = createMockUser({ username });

      vi.mocked(mockContext.req.header).mockReturnValue(username);
      mockUserRepository.findByUsername.mockResolvedValue(user);

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(true);
    });

    it('should return failure when repository throws error', async () => {
      const username = 'erroruser';
      const error = new Error('Database error');

      vi.mocked(mockContext.req.header).mockReturnValue(username);
      mockUserRepository.findByUsername.mockRejectedValue(error);

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('should return failure when create throws error', async () => {
      const username = 'newuser';
      const error = new Error('Failed to create user');

      vi.mocked(mockContext.req.header).mockReturnValue(username);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(error);

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('should handle non-Error exceptions', async () => {
      const username = 'erroruser';
      const error = 'String error';

      vi.mocked(mockContext.req.header).mockReturnValue(username);
      mockUserRepository.findByUsername.mockRejectedValue(error);

      const result = await usernameHeaderAuth(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Failed to authenticate user');
    });
  });
});
