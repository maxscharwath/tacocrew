/**
 * Unit tests for auth middleware
 */

import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import type { Context, Next } from 'hono';
import {
  authMiddleware,
  createAuthMiddleware,
  optionalAuthMiddleware,
} from '@/api/middleware/auth.middleware';
import type { AuthMethod } from '@/api/middleware/auth.types';
import type { User, UserId } from '@/schemas/user.schema';
import { UnauthorizedError } from '@/shared/utils/errors.utils';

describe('createAuthMiddleware', () => {
  let mockContext: Context;
  let mockNext: Next;
  const mockUserId = 'user-123' as UserId;
  const mockUser: User = {
    id: mockUserId,
    username: 'testuser',
    name: 'Test User',
    phone: null,
    language: null,
  };

  beforeEach(() => {
    mockContext = {
      var: {},
      set: mock(),
    } as unknown as Context;

    mockNext = mock().mockResolvedValue(undefined);
  });

  describe('required authentication', () => {
    it('should call next when authentication succeeds', async () => {
      const authMethod: AuthMethod = mock().mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const middleware = createAuthMiddleware([authMethod], true);

      await middleware(mockContext, mockNext);

      expect(authMethod).toHaveBeenCalledWith(mockContext);
      expect(mockContext.set).toHaveBeenCalledWith('user', mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when all methods fail', async () => {
      const authMethod1: AuthMethod = mock().mockResolvedValue({
        success: false,
      });
      const authMethod2: AuthMethod = mock().mockResolvedValue({
        success: false,
        error: new Error('Method 2 failed'),
      });

      const middleware = createAuthMiddleware([authMethod1, authMethod2], true);

      await expect(middleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include error message in UnauthorizedError', async () => {
      const error = new Error('Test error');
      const authMethod: AuthMethod = mock().mockResolvedValue({
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
      const failingMethod: AuthMethod = mock().mockResolvedValue({
        success: false,
      });
      const succeedingMethod: AuthMethod = mock().mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const middleware = createAuthMiddleware([failingMethod, succeedingMethod], true);

      await middleware(mockContext, mockNext);

      expect(failingMethod).toHaveBeenCalled();
      expect(succeedingMethod).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should stop trying methods after first success', async () => {
      const firstMethod: AuthMethod = mock().mockResolvedValue({
        success: true,
        user: mockUser,
      });
      const secondMethod: AuthMethod = mock();

      const middleware = createAuthMiddleware([firstMethod, secondMethod], true);

      await middleware(mockContext, mockNext);

      expect(firstMethod).toHaveBeenCalled();
      expect(secondMethod).not.toHaveBeenCalled();
    });
  });

  describe('optional authentication', () => {
    it('should call next even when all methods fail', async () => {
      const authMethod: AuthMethod = mock().mockResolvedValue({
        success: false,
      });

      const middleware = createAuthMiddleware([authMethod], false);

      await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should set user context when authentication succeeds', async () => {
      const authMethod: AuthMethod = mock().mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const middleware = createAuthMiddleware([authMethod], false);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('user', mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not set context when authentication fails', async () => {
      const authMethod: AuthMethod = mock().mockResolvedValue({
        success: false,
      });

      const middleware = createAuthMiddleware([authMethod], false);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('context setting', () => {
    it('should set user in context when provided', async () => {
      const authMethod: AuthMethod = mock().mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const middleware = createAuthMiddleware([authMethod], true);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('user', mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not set user when authentication fails', async () => {
      const authMethod: AuthMethod = mock().mockResolvedValue({
        success: false,
      });

      const middleware = createAuthMiddleware([authMethod], false);

      await middleware(mockContext, mockNext);

      expect(mockContext.set).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
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
        header: mock(),
      },
      set: mock(),
    } as unknown as Context;

    mockNext = mock().mockResolvedValue(undefined);
  });

  it('should be a middleware function', () => {
    expect(typeof authMiddleware).toBe('function');
  });

  it('should throw UnauthorizedError when no auth method succeeds', async () => {
    mockContext.req.header.mockReturnValue(undefined);

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
        header: mock(),
      },
      set: mock(),
    } as unknown as Context;

    mockNext = mock().mockResolvedValue(undefined);
  });

  it('should be a middleware function', () => {
    expect(typeof optionalAuthMiddleware).toBe('function');
  });

  it('should call next even when no auth method succeeds', async () => {
    mockContext.req.header.mockReturnValue(undefined);

    await optionalAuthMiddleware(mockContext, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
