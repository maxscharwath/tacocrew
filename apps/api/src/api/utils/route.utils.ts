/**
 * Route utilities for Hono OpenAPI
 * @module api/utils/route.utils
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { authMiddleware } from '@/api/middleware/auth.middleware';
import type { User } from '@/schemas/user.schema';

/**
 * Authenticated context - user (User) is guaranteed to be set
 * Use this type when you need type-safe access to the authenticated user
 * Similar to Spring Boot's Principal pattern
 */
export type AuthenticatedContext = Context & {
  var: {
    user: User;
  };
};

/**
 * Create a new OpenAPIHono app instance
 */
export function createRouteApp(): OpenAPIHono {
  return new OpenAPIHono();
}

/**
 * Create a route app with authentication middleware
 * Handlers receive AuthenticatedContext with guaranteed user
 * Access the user with: c.var.user (Principal pattern)
 */
export function createAuthenticatedRouteApp(): OpenAPIHono<{
  Variables: {
    user: User;
  };
}> {
  const app = new OpenAPIHono<{
    Variables: {
      user: User;
    };
  }>();
  app.use('*', authMiddleware);
  return app;
}

/**
 * Security definition for authentication
 * Uses Better Auth session or Bearer token (JWT) fallback
 */
export const authSecurity: Array<{ BearerAuth?: never[] }> = [{ BearerAuth: [] }];

/**
 * Create a grouped route app (e.g., for /api/v1)
 * Accepts routes with different environment types (authenticated and unauthenticated)
 */
// biome-ignore lint/suspicious/noExplicitAny: Hono's type system requires flexibility for mixed route types
export function createRouteGroup(...routes: OpenAPIHono<any>[]): OpenAPIHono {
  const group = createRouteApp();
  for (const route of routes) {
    group.route('/', route);
  }
  return group;
}
