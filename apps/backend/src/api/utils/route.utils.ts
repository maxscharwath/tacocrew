/**
 * Route utilities for Hono OpenAPI
 * @module api/utils/route.utils
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { authMiddleware } from '@/api/middleware/auth.middleware';
import type { UserId } from '@/schemas/user.schema';
import { UnauthorizedError } from '@/shared/utils/errors.utils';

/**
 * Create a new OpenAPIHono app instance
 */
export function createRouteApp(): OpenAPIHono {
  return new OpenAPIHono();
}

/**
 * Create a route app with authentication middleware
 */
export function createAuthenticatedRouteApp(): OpenAPIHono {
  const app = createRouteApp();
  app.use('*', authMiddleware);
  return app;
}

/**
 * Security definition for Bearer token authentication
 */
export const bearerSecurity = [{ BearerAuth: [] }];

/**
 * Security definition for username header authentication
 */
export const usernameHeaderSecurity = [{ UsernameHeader: [] }];

/**
 * Security definition allowing either Bearer token or username header
 * This matches the authMiddleware behavior which accepts either method
 */
export const authSecurity: Array<{ BearerAuth?: never[]; UsernameHeader?: never[] }> = [
  { BearerAuth: [] },
  { UsernameHeader: [] },
];

/**
 * Helper to extract and validate userId from context
 */
export function requireUserId(c: { var: { userId?: UserId } }): UserId {
  const userId = c.var.userId;
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return userId;
}

/**
 * Create a grouped route app (e.g., for /api/v1)
 */
export function createRouteGroup(...routes: OpenAPIHono[]): OpenAPIHono {
  const group = createRouteApp();
  routes.forEach((route) => {
    group.route('/', route);
  });
  return group;
}
