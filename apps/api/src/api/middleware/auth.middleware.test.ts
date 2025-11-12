/**
 * Unit tests for auth middleware
 */

import type { Context, Next } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserId } from '../../schemas/user.schema';
import { UnauthorizedError } from '../../shared/utils/errors.utils';
import { authMiddleware, createAuthMiddleware, optionalAuthMiddleware } from './auth.middleware';
import type { AuthMethod } from './auth.types';

describe('createAuthMiddleware', () => {
  let mockContext: Context;
  let mockNext: Next;
  const mockUserId = 'user-123' as UserId;

  beforeEach(() => {
    mockContext = {
      var: {},
      set: vi.fn(),
    } as unknown as Context;

    mockNext = vi.fn().mockResolvedValue(undefined);
  });

  describe('required authentication', () => {
    it('should call next when authentication succeeds', async () => {
      const authMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: true,
        userId: mockUserId,
        username: 'testuser',
      });

      const middleware = createAuthMiddleware([authMethod], true);

      await middleware(mockContext, mockNext);

      expect(authMethod).toHaveBeenCalledWith(mockContext);
      expect(mockContext.set).toHaveBeenCalledWith('userId', mockUserId);
      expect(mockContext.set).toHaveBeenCalledWith('username', 'testuser');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set slackId in context when provided', async () => {
      const authMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: true,
        userId: mockUserId,
        username: 'testuser',
        slackId: 'slack-123',
      });

      const middleware = createAuthMiddleware([authMethod], true);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('slackId', 'slack-123');
    });

    it('should throw UnauthorizedError when all methods fail', async () => {
      const authMethod1: AuthMethod = vi.fn().mockResolvedValue({
        success: false,
      });
      const authMethod2: AuthMethod = vi.fn().mockResolvedValue({
        success: false,
        error: new Error('Method 2 failed'),
      });

      const middleware = createAuthMiddleware([authMethod1, authMethod2], true);

      await expect(middleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include error message in UnauthorizedError', async () => {
      const error = new Error('Test error');
      const authMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: false,
        error,
      });

      const middleware = createAuthMiddleware([authMethod], true);

      await expect(middleware(mockContext, mockNext)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Test error'),
        })
      );
    });

    it('should try methods in order until one succeeds', async () => {
      const failingMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: false,
      });
      const succeedingMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: true,
        userId: mockUserId,
        username: 'testuser',
      });

      const middleware = createAuthMiddleware([failingMethod, succeedingMethod], true);

      await middleware(mockContext, mockNext);

      expect(failingMethod).toHaveBeenCalled();
      expect(succeedingMethod).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should stop trying methods after first success', async () => {
      const firstMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: true,
        userId: mockUserId,
        username: 'testuser',
      });
      const secondMethod: AuthMethod = vi.fn();

      const middleware = createAuthMiddleware([firstMethod, secondMethod], true);

      await middleware(mockContext, mockNext);

      expect(firstMethod).toHaveBeenCalled();
      expect(secondMethod).not.toHaveBeenCalled();
    });
  });

  describe('optional authentication', () => {
    it('should call next even when all methods fail', async () => {
      const authMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: false,
      });

      const middleware = createAuthMiddleware([authMethod], false);

      await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should set user context when authentication succeeds', async () => {
      const authMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: true,
        userId: mockUserId,
        username: 'testuser',
      });

      const middleware = createAuthMiddleware([authMethod], false);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('userId', mockUserId);
      expect(mockContext.set).toHaveBeenCalledWith('username', 'testuser');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not set context when authentication fails', async () => {
      const authMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: false,
      });

      const middleware = createAuthMiddleware([authMethod], false);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('context setting', () => {
    it('should only set userId if provided', async () => {
      const authMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: true,
        userId: mockUserId,
      });

      const middleware = createAuthMiddleware([authMethod], true);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('userId', mockUserId);
      expect(mockContext.set).not.toHaveBeenCalledWith('username', expect.anything());
      expect(mockContext.set).not.toHaveBeenCalledWith('slackId', expect.anything());
    });

    it('should only set username if provided', async () => {
      const authMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: true,
        username: 'testuser',
      });

      const middleware = createAuthMiddleware([authMethod], true);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('username', 'testuser');
      expect(mockContext.set).not.toHaveBeenCalledWith('userId', expect.anything());
    });

    it('should handle partial user data', async () => {
      const authMethod: AuthMethod = vi.fn().mockResolvedValue({
        success: true,
        userId: mockUserId,
        username: 'testuser',
        // No slackId
      });

      const middleware = createAuthMiddleware([authMethod], true);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('userId', mockUserId);
      expect(mockContext.set).toHaveBeenCalledWith('username', 'testuser');
      expect(mockContext.set).not.toHaveBeenCalledWith('slackId', expect.anything());
    });
  });
});

describe('authMiddleware', () => {
  let mockContext: Context;
  let mockNext: Next;

  beforeEach(() => {
    mockContext = {
      var: {},
      req: {
        header: vi.fn(),
      },
      set: vi.fn(),
    } as unknown as Context;

    mockNext = vi.fn().mockResolvedValue(undefined);
  });

  it('should be a middleware function', () => {
    expect(typeof authMiddleware).toBe('function');
  });

  it('should throw UnauthorizedError when no auth method succeeds', async () => {
    vi.mocked(mockContext.req.header).mockReturnValue(undefined);

    await expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('optionalAuthMiddleware', () => {
  let mockContext: Context;
  let mockNext: Next;

  beforeEach(() => {
    mockContext = {
      var: {},
      req: {
        header: vi.fn(),
      },
      set: vi.fn(),
    } as unknown as Context;

    mockNext = vi.fn().mockResolvedValue(undefined);
  });

  it('should be a middleware function', () => {
    expect(typeof optionalAuthMiddleware).toBe('function');
  });

  it('should call next even when no auth method succeeds', async () => {
    vi.mocked(mockContext.req.header).mockReturnValue(undefined);

    await optionalAuthMiddleware(mockContext, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
