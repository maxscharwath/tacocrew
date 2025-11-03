/**
 * User routes for Hono
 * @module hono/routes/user
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { UserMapper } from '@/application/mappers/user.mapper';
import type { UserId } from '@/domain/schemas/user.schema';
import { authMiddleware } from '@/hono/middleware/auth';
import { jsonContent, UserSchemas } from '@/hono/routes/user.schemas';
import { UserService } from '@/services/user.service';
import { UnauthorizedError } from '@/utils/errors';
import { inject } from '@/utils/inject';

const app = new OpenAPIHono();

const requireUserId = (c: Context): UserId => {
  const userId = c.var.userId;
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return userId;
};

const userService = () => inject(UserService);
const security = [{ BearerAuth: [] as string[] }];

// All user routes require authentication
app.use('*', authMiddleware);

const routes = [
  {
    route: createRoute({
      method: 'get',
      path: '/me',
      tags: ['User'],
      security,
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
    handler: async (c: Context) => {
      const userId = requireUserId(c);
      const user = await userService().getUserById(userId);
      return c.json(UserMapper.toResponseDto(user), 200);
    },
  },
  {
    route: createRoute({
      method: 'get',
      path: '/me/orders',
      tags: ['User'],
      security,
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
    handler: async (c: Context) => {
      const userId = requireUserId(c);
      const orders = await userService().getUserOrderHistory(userId);
      return c.json(orders, 200);
    },
  },
  {
    route: createRoute({
      method: 'get',
      path: '/me/group-orders',
      tags: ['User'],
      security,
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
    handler: async (c: Context) => {
      const userId = requireUserId(c);
      const groupOrders = await userService().getUserGroupOrders(userId);
      return c.json(groupOrders, 200);
    },
  },
];

routes.forEach(({ route, handler }) => app.openapi(route, handler));

export const userRoutes = app;
