/**
 * Group order routes for Hono
 * @module hono/routes/group-order
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { GroupOrderMapper } from '@/application/mappers/group-order.mapper';
import { UserOrderMapper } from '@/application/mappers/user-order.mapper';
import type { GroupOrderId } from '@/domain/schemas/group-order.schema';
import type { UserId } from '@/domain/schemas/user.schema';
import { authMiddleware } from '@/hono/middleware/auth';
import { GroupOrderSchemas, GroupOrderSecurity } from '@/hono/routes/group-order.schemas';
import { GroupOrderService } from '@/services/group-order.service';
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

const jsonContent = (schema: unknown) => ({
  'application/json': { schema },
});

const validationErrorResponse = {
  description: 'Validation error',
  content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
};

const notFoundResponse = {
  description: 'Not found',
  content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
};

const service = () => inject(GroupOrderService);

// Apply auth middleware to all routes (requires bearer token)
app.use('*', authMiddleware);

const routeDefinitions = [
  {
    route: createRoute({
      method: 'post',
      path: '/',
      tags: ['Group Orders'],
      security: GroupOrderSecurity,
      request: {
        body: {
          content: jsonContent(GroupOrderSchemas.CreateGroupOrderSchema),
          required: true,
        },
      },
      responses: {
        201: {
          description: 'Group order created',
          content: jsonContent(GroupOrderSchemas.GroupOrderResponseSchema),
        },
        400: validationErrorResponse,
      },
    }),
    handler: async (c) => {
      const userId = requireUserId(c);
      const body = c.req.valid('json');
      const groupOrder = await service().createGroupOrder(userId, body);
      return c.json(GroupOrderMapper.toResponseDto(groupOrder), 201);
    },
  },
  {
    route: createRoute({
      method: 'get',
      path: '/{id}',
      tags: ['Group Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
      },
      responses: {
        200: {
          description: 'Group order',
          content: jsonContent(GroupOrderSchemas.GroupOrderResponseSchema),
        },
        404: notFoundResponse,
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const groupOrder = await service().getGroupOrder(id);
      return c.json(GroupOrderMapper.toResponseDto(groupOrder));
    },
  },
  {
    route: createRoute({
      method: 'get',
      path: '/{id}/details',
      tags: ['Group Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
      },
      responses: {
        200: {
          description: 'Group order with user orders',
          content: jsonContent(GroupOrderSchemas.GroupOrderWithOrdersSchema),
        },
        404: notFoundResponse,
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const { groupOrder, userOrders } = await service().getGroupOrderWithUserOrders(id);
      return c.json(GroupOrderMapper.toResponseDtoWithUserOrders(groupOrder, userOrders));
    },
  },
  {
    route: createRoute({
      method: 'put',
      path: '/{id}',
      tags: ['Group Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
        body: {
          content: jsonContent(GroupOrderSchemas.UpdateGroupOrderSchema),
        },
      },
      responses: {
        200: {
          description: 'Updated group order',
          content: jsonContent(GroupOrderSchemas.GroupOrderResponseSchema),
        },
        400: validationErrorResponse,
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const userId = requireUserId(c);
      const body = c.req.valid('json');
      const groupOrder = await service().updateGroupOrder(id, userId, body);
      return c.json(GroupOrderMapper.toResponseDto(groupOrder));
    },
  },
  {
    route: createRoute({
      method: 'post',
      path: '/{id}/submit',
      tags: ['Group Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
      },
      responses: {
        200: {
          description: 'Group order marked as submitted',
          content: jsonContent(GroupOrderSchemas.GroupOrderResponseSchema),
        },
        400: validationErrorResponse,
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const userId = requireUserId(c);
      const groupOrder = await service().submitGroupOrder(id, userId);
      return c.json(GroupOrderMapper.toResponseDto(groupOrder));
    },
  },
  {
    route: createRoute({
      method: 'post',
      path: '/{id}/submit-to-backend',
      tags: ['Group Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
        body: {
          content: jsonContent(GroupOrderSchemas.SubmitGroupOrderRequestSchema),
          required: true,
        },
      },
      responses: {
        201: {
          description: 'Group order submitted to backend',
          content: jsonContent(GroupOrderSchemas.SubmitGroupOrderResultSchema),
        },
        400: validationErrorResponse,
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const userId = requireUserId(c);
      const body = c.req.valid('json');
      const result = await service().submitGroupOrderToBackend(id, userId, body);
      return c.json(result, 201);
    },
  },
  {
    route: createRoute({
      method: 'get',
      path: '/{id}/orders/my',
      tags: ['User Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
      },
      responses: {
        200: {
          description: 'Current user order',
          content: jsonContent(GroupOrderSchemas.UserOrderResponseSchema),
        },
        404: notFoundResponse,
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const userId = requireUserId(c);
      const userOrder = await service().getUserOrder(id, userId);
      return c.json(UserOrderMapper.toResponseDto(userOrder));
    },
  },
  {
    route: createRoute({
      method: 'put',
      path: '/{id}/orders/my',
      tags: ['User Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
        body: {
          content: jsonContent(GroupOrderSchemas.UpdateUserOrderSchema),
          required: true,
        },
      },
      responses: {
        200: {
          description: 'Upserted user order',
          content: jsonContent(GroupOrderSchemas.UserOrderResponseSchema),
        },
        400: validationErrorResponse,
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const userId = requireUserId(c);
      const body = c.req.valid('json');
      const userOrder = await service().createUserOrder(id, userId, body);
      return c.json(UserOrderMapper.toResponseDto(userOrder));
    },
  },
  {
    route: createRoute({
      method: 'post',
      path: '/{id}/orders/my/submit',
      tags: ['User Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
      },
      responses: {
        200: {
          description: 'Submitted user order',
          content: jsonContent(GroupOrderSchemas.UserOrderResponseSchema),
        },
        400: validationErrorResponse,
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const userId = requireUserId(c);
      const userOrder = await service().submitUserOrder(id, userId);
      return c.json(UserOrderMapper.toResponseDto(userOrder));
    },
  },
  {
    route: createRoute({
      method: 'delete',
      path: '/{id}/orders/my',
      tags: ['User Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
      },
      responses: {
        204: {
          description: 'User order deleted',
        },
        400: validationErrorResponse,
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const userId = requireUserId(c);
      await service().deleteUserOrder(id, userId, userId);
      return c.body(null, 204);
    },
  },
  {
    route: createRoute({
      method: 'get',
      path: '/{id}/orders',
      tags: ['User Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderIdParamsSchema,
      },
      responses: {
        200: {
          description: 'List of user orders',
          content: jsonContent(GroupOrderSchemas.UserOrderListSchema),
        },
      },
    }),
    handler: async (c) => {
      const { id } = c.req.valid('param');
      const { userOrders } = await service().getGroupOrderWithUserOrders(id);
      return c.json(userOrders.map((uo) => UserOrderMapper.toResponseDto(uo)));
    },
  },
  {
    route: createRoute({
      method: 'delete',
      path: '/{id}/orders/{userId}',
      tags: ['User Orders'],
      security: GroupOrderSecurity,
      request: {
        params: GroupOrderSchemas.GroupOrderAndUserIdParamsSchema,
      },
      responses: {
        204: {
          description: 'User order deleted',
        },
        400: validationErrorResponse,
      },
    }),
    handler: async (c) => {
      const { id, userId } = c.req.valid('param');
      const deleterUserId = requireUserId(c);
      await service().deleteUserOrder(id, userId, deleterUserId);
      return c.body(null, 204);
    },
  },
];

routeDefinitions.forEach(({ route, handler }) => {
  app.openapi(route, handler);
});

export const groupOrderRoutes = app;
