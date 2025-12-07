/**
 * Unit tests for bearer token authentication method
 */

import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { bearerTokenAuth } from '@/api/middleware/auth-methods/bearer-token.auth';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import type { User, UserId } from '@/schemas/user.schema';
import { AuthService } from '@/services/auth/auth.service';
import { UnauthorizedError, ValidationError } from '@/shared/utils/errors.utils';

describe('bearerTokenAuth', () => {
  let mockContext: Context;
  let mockAuthService: {
    generateToken: ReturnType<typeof mock>;
    verifyToken: ReturnType<typeof mock>;
  };
  let mockUserRepository: {
    findById: ReturnType<typeof mock>;
  };
  const mockUserId = 'user-123' as UserId;
  const mockUser: User = {
    id: mockUserId,
    username: 'testuser',
    name: 'Test User',
    phone: null,
    language: null,
  };

  beforeEach(() => {
    container.clearInstances();

    // Create mock context
    mockContext = {
      req: {
        header: mock(),
      },
    } as unknown as Context;

    // Create and register mock auth service
    mockAuthService = {
      generateToken: mock(),
      verifyToken: mock(),
    };
    container.registerInstance(AuthService, mockAuthService as unknown as AuthService);

    // Create and register mock user repository
    mockUserRepository = {
      findById: mock(),
    };
    container.registerInstance(UserRepository, mockUserRepository as unknown as UserRepository);
  });

  describe('successful authentication', () => {
    it('should authenticate with valid Bearer token', async () => {
      const token = 'valid-token';
      const payload = {
        userId: mockUserId,
      };

      mockContext.req.header.mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockReturnValue(payload);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
    });

    it('should return failure when user not found', async () => {
      const token = 'valid-token';
      const payload = {
        userId: mockUserId,
      };

      mockContext.req.header.mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockReturnValue(payload);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('failure cases', () => {
    it('should return failure when no authorization header', async () => {
      mockContext.req.header.mockReturnValue(undefined);

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(false);
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should return failure when authorization header does not start with Bearer', async () => {
      mockContext.req.header.mockReturnValue('Invalid token');

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(false);
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should return failure when token verification throws UnauthorizedError', async () => {
      const token = 'invalid-token';
      const error = new UnauthorizedError('Token expired');

      mockContext.req.header.mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockImplementation(() => {
        throw error;
      });

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('should return failure when token verification throws ValidationError', async () => {
      const token = 'invalid-token';
      const error = new ValidationError('Invalid token');

      mockContext.req.header.mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockImplementation(() => {
        throw error;
      });

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
      expect(result.error?.message).toBe('Invalid or expired token');
    });

    it('should return failure when token verification throws other error', async () => {
      const token = 'invalid-token';
      const error = new Error('Unexpected error');

      mockContext.req.header.mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockImplementation(() => {
        throw error;
      });

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
      expect(result.error?.message).toBe('Invalid or expired token');
    });
  });

  describe('token extraction', () => {
    it('should correctly extract token from Bearer header', async () => {
      const token = 'my-secret-token';
      const payload = {
        userId: mockUserId,
      };

      mockContext.req.header.mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockReturnValue(payload);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      await bearerTokenAuth(mockContext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockAuthService.verifyToken).not.toHaveBeenCalledWith(`Bearer ${token}`);
    });

    it('should handle token with spaces correctly', async () => {
      const token = 'token-with-spaces';
      const payload = {
        userId: mockUserId,
      };

      mockContext.req.header.mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockReturnValue(payload);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      await bearerTokenAuth(mockContext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });
  });
});
