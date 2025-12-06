/**
 * Authentication middleware with pluggable auth methods
 * @module api/middleware/auth
 */

import type { Context } from 'hono';
import { MiddlewareHandler, Next } from 'hono';
import type { AuthMethod, AuthResult } from '@/api/middleware/auth.types';
import { bearerTokenAuth } from '@/api/middleware/auth-methods/bearer-token.auth';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { UnauthorizedError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

// Re-export types and auth methods for convenience
export type { AuthMethod, AuthResult } from '@/api/middleware/auth.types';
export { bearerTokenAuth } from '@/api/middleware/auth-methods/bearer-token.auth';

/**
 * Store user info in context
 */
function setUserContext(c: Context, result: AuthResult): void {
  if (result.userId) {
    c.set('userId', result.userId);
  }
  if (result.username) {
    c.set('username', result.username);
  }
  if (result.slackId) {
    c.set('slackId', result.slackId);
  }
  if (result.email) {
    c.set('email', result.email);
  }
}

/**
 * Check if Better Auth session exists in context and map to our user
 * This leverages the global Better Auth middleware that sets user/session in context
 */
async function checkBetterAuthSession(c: Context): Promise<AuthResult | null> {
  const betterAuthUser = c.get('user');

  if (!betterAuthUser?.email) {
    return null;
  }

  try {
    // Look up our user by email to get the UUID and other fields
    const userRepository = inject(UserRepository);
    const user = await userRepository.findByEmail(betterAuthUser.email);

    if (!user) {
      // User doesn't exist in our system yet - create them
      const baseUsername = betterAuthUser.name || betterAuthUser.email.split('@')[0];
      let username = baseUsername;
      let attempt = 0;

      while (attempt < 5) {
        try {
          const newUser = await userRepository.create({
            email: betterAuthUser.email,
            name: betterAuthUser.name || username,
            username: username,
          });

          return {
            success: true,
            userId: newUser.id,
            username: newUser.username || username,
            slackId: newUser.slackId ?? undefined,
            email: betterAuthUser.email,
          };
        } catch (error: unknown) {
          // If username conflict, try with a number suffix
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'P2002' &&
            'meta' in error &&
            error.meta &&
            typeof error.meta === 'object' &&
            'target' in error.meta &&
            Array.isArray(error.meta.target) &&
            error.meta.target.includes('username')
          ) {
            attempt++;
            username = `${baseUsername}${attempt}`;
            continue;
          }
          // Other errors - return null to try fallback auth methods
          return null;
        }
      }

      return null; // Exhausted attempts
    }

    // User exists - return their info
    return {
      success: true,
      userId: user.id,
      username: user.username || betterAuthUser.name || betterAuthUser.email.split('@')[0],
      slackId: user.slackId ?? undefined,
      email: betterAuthUser.email,
    };
  } catch (error_) {
    // If lookup fails, return null to try fallback auth methods
    // Log error for debugging but don't expose to user
    logger.debug('Failed to check Better Auth session', { error: error_ });
    return null;
  }
}

/**
 * Create authentication middleware with configurable auth methods
 * Checks Better Auth session first, then tries fallback methods
 * @param methods - Array of fallback authentication methods to try
 * @param required - If true, at least one method must succeed (default: true)
 * @returns Authentication middleware
 */
export function createAuthMiddleware(methods: AuthMethod[], required = true): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    // First, check Better Auth session from global middleware
    const betterAuthResult = await checkBetterAuthSession(c);

    if (betterAuthResult) {
      setUserContext(c, betterAuthResult);
      await next();
      return;
    }

    // Fall back to other auth methods (bearer token, username header)
    for (const method of methods) {
      const result = await method(c);

      if (result.success) {
        setUserContext(c, result);
        await next();
        return;
      }
    }

    if (required) {
      throw new UnauthorizedError();
    }

    await next();
  };
}

/**
 * Default fallback authentication methods (Bearer token for API access)
 * Better Auth session is checked first in createAuthMiddleware before these methods
 *
 * @example
 * // Use only Bearer token authentication
 * const bearerOnlyMiddleware = createAuthMiddleware([bearerTokenAuth]);
 *
 * @example
 * // Add a custom authentication method
 * const customAuth: AuthMethod = async (c) => {
 *   // Your custom auth logic
 *   return { success: true, userId: '...', username: '...' };
 * };
 * const customMiddleware = createAuthMiddleware([bearerTokenAuth, customAuth]);
 */
const defaultAuthMethods: AuthMethod[] = [bearerTokenAuth];

/**
 * Required authentication middleware
 * Checks Better Auth session first, then falls back to Bearer token for API access
 */
export const authMiddleware = createAuthMiddleware(defaultAuthMethods, true);

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if no valid credentials are provided
 */
export const optionalAuthMiddleware = createAuthMiddleware(defaultAuthMethods, false);
