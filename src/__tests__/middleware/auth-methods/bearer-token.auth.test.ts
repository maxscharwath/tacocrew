/**
 * Unit tests for bearer token authentication method
 */

import type { Context } from 'hono';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bearerTokenAuth } from '@/api/middleware/auth-methods/bearer-token.auth';
import type { UserId } from '@/schemas/user.schema';
import { AuthService } from '@/services/auth/auth.service';
import { UnauthorizedError, ValidationError } from '@/shared/utils/errors.utils';
import { createMockAuthService } from '../../mocks';

describe('bearerTokenAuth', () => {
  let mockContext: Context;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  const mockUserId = 'user-123' as UserId;

  beforeEach(() => {
    container.clearInstances();

    // Create mock context
    mockContext = {
      req: {
        header: vi.fn(),
      },
    } as unknown as Context;

    // Create and register mock auth service
    mockAuthService = createMockAuthService();
    container.registerInstance(AuthService, mockAuthService as unknown as AuthService);
  });

  describe('successful authentication', () => {
    it('should authenticate with valid Bearer token', async () => {
      const token = 'valid-token';
      const payload = {
        userId: mockUserId,
        username: 'testuser',
        slackId: 'slack-123',
      };

      vi.mocked(mockContext.req.header).mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockReturnValue(payload);

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(mockUserId);
      expect(result.username).toBe('testuser');
      expect(result.slackId).toBe('slack-123');
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });

    it('should authenticate with valid token without slackId', async () => {
      const token = 'valid-token';
      const payload = {
        userId: mockUserId,
        username: 'testuser',
      };

      vi.mocked(mockContext.req.header).mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockReturnValue(payload);

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(mockUserId);
      expect(result.username).toBe('testuser');
      expect(result.slackId).toBeUndefined();
    });
  });

  describe('failure cases', () => {
    it('should return failure when no authorization header', async () => {
      vi.mocked(mockContext.req.header).mockReturnValue(undefined);

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(false);
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should return failure when authorization header does not start with Bearer', async () => {
      vi.mocked(mockContext.req.header).mockReturnValue('Invalid token');

      const result = await bearerTokenAuth(mockContext);

      expect(result.success).toBe(false);
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should return failure when token verification throws UnauthorizedError', async () => {
      const token = 'invalid-token';
      const error = new UnauthorizedError('Token expired');

      vi.mocked(mockContext.req.header).mockReturnValue(`Bearer ${token}`);
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

      vi.mocked(mockContext.req.header).mockReturnValue(`Bearer ${token}`);
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

      vi.mocked(mockContext.req.header).mockReturnValue(`Bearer ${token}`);
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
        username: 'testuser',
      };

      vi.mocked(mockContext.req.header).mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockReturnValue(payload);

      await bearerTokenAuth(mockContext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockAuthService.verifyToken).not.toHaveBeenCalledWith(`Bearer ${token}`);
    });

    it('should handle token with spaces correctly', async () => {
      const token = 'token-with-spaces';
      const payload = {
        userId: mockUserId,
        username: 'testuser',
      };

      vi.mocked(mockContext.req.header).mockReturnValue(`Bearer ${token}`);
      mockAuthService.verifyToken.mockReturnValue(payload);

      await bearerTokenAuth(mockContext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });
  });
});
