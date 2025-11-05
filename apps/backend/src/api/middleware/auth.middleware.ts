/**
 * Authentication middleware with pluggable auth methods
 * @module api/middleware/auth
 */

import type { Context } from 'hono';
import { MiddlewareHandler, Next } from 'hono';
import { UnauthorizedError } from '@/shared/utils/errors.utils';
import type { AuthMethod, AuthResult } from './auth.types';
import { bearerTokenAuth } from './auth-methods/bearer-token.auth';
import { usernameHeaderAuth } from './auth-methods/username-header.auth';

// Re-export types and auth methods for convenience
export type { AuthMethod, AuthResult } from './auth.types';
export { bearerTokenAuth } from './auth-methods/bearer-token.auth';
export { usernameHeaderAuth } from './auth-methods/username-header.auth';

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
}

/**
 * Create authentication middleware with configurable auth methods
 * @param methods - Array of authentication methods to try
 * @param required - If true, at least one method must succeed (default: true)
 * @returns Authentication middleware
 */
export function createAuthMiddleware(methods: AuthMethod[], required = true): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const errors: Error[] = [];

    for (const method of methods) {
      const result = await method(c);

      if (result.success) {
        setUserContext(c, result);
        await next();
        return;
      }

      if (result.error) {
        errors.push(result.error);
      }
    }

    if (required) {
      const methodNames = methods.map((m) => m.name || 'unknown').join(', ');
      throw new UnauthorizedError(
        `Authentication required. Tried methods: ${methodNames}. ${errors.length > 0 ? `Last error: ${errors[errors.length - 1]?.message}` : ''}`
      );
    }

    await next();
  };
}

/**
 * Default authentication methods (Bearer token and username header)
 *
 * @example
 * // Use only Bearer token authentication
 * const bearerOnlyMiddleware = createAuthMiddleware([bearerTokenAuth]);
 *
 * @example
 * // Use only username header authentication
 * const usernameOnlyMiddleware = createAuthMiddleware([usernameHeaderAuth]);
 *
 * @example
 * // Add a custom authentication method
 * const customAuth: AuthMethod = async (c) => {
 *   // Your custom auth logic
 *   return { success: true, userId: '...', username: '...' };
 * };
 * const customMiddleware = createAuthMiddleware([bearerTokenAuth, customAuth]);
 */
const defaultAuthMethods: AuthMethod[] = [bearerTokenAuth, usernameHeaderAuth];

/**
 * Required authentication middleware
 * Uses Bearer token and username header authentication
 */
export const authMiddleware = createAuthMiddleware(defaultAuthMethods, true);

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if no valid token is provided
 */
export const optionalAuthMiddleware = createAuthMiddleware(defaultAuthMethods, false);
