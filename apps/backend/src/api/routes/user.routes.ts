/**
 * User routes for Hono
 * @module api/routes/user
 */

import { createRoute } from '@hono/zod-openapi';
import { jsonContent, UserSchemas } from '@/api/schemas/user.schemas';
import { authSecurity, createAuthenticatedRouteApp, requireUserId } from '@/api/utils/route.utils';
import { UserService } from '@/services/user/user.service';
import { inject } from '@/shared/utils/inject.utils';

const app = createAuthenticatedRouteApp();

app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me',
    tags: ['User'],
    security: authSecurity,
    responses: {
      200: {
        description: 'Authenticated user profile',
        content: jsonContent(UserSchemas.UserResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const user = await inject(UserService).getUserById(userId);
    return c.json(
      {
        id: user.id,
        username: user.username,
        slackId: user.slackId ?? undefined,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      },
      200
    );
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/orders',
    tags: ['User'],
    security: authSecurity,
    responses: {
      200: {
        description: "User's order history",
        content: jsonContent(UserSchemas.UserOrderHistoryEntrySchema.array()),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const orders = await inject(UserService).getUserOrderHistory(userId);
    return c.json(orders, 200);
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/group-orders',
    tags: ['User'],
    security: authSecurity,
    responses: {
      200: {
        description: 'Group orders where the user is leader',
        content: jsonContent(UserSchemas.UserGroupOrderSchema.array()),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const groupOrders = await inject(UserService).getUserGroupOrders(userId);
    return c.json(groupOrders, 200);
  }
);

export const userRoutes = app;
