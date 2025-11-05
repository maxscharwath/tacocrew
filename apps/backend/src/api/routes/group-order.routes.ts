/**
 * Group order routes
 * @module api/routes/group-order
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { jsonContent } from '@/api/schemas/shared.schemas';
import { UserOrderItemsSchema } from '@/api/schemas/user-order.schemas';
import { authSecurity, createAuthenticatedRouteApp, requireUserId } from '@/api/utils/route.utils';
import { GroupOrderIdSchema } from '@/schemas/group-order.schema';
import { CreateGroupOrderUseCase } from '@/services/group-order/create-group-order.service';
import { GetGroupOrderUseCase } from '@/services/group-order/get-group-order.service';
import { GetGroupOrderWithUserOrdersUseCase } from '@/services/group-order/get-group-order-with-user-orders.service';
import { inject } from '@/shared/utils/inject.utils';

const app = createAuthenticatedRouteApp();

const CreateGroupOrderRequestSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const GroupOrderResponseSchema = z.object({
  id: z.string(),
  leaderId: z.string(),
  name: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const UserOrderResponseSchema = z.object({
  id: z.string(),
  groupOrderId: z.string(),
  userId: z.string(),
  username: z.string().optional(),
  status: z.string(),
  items: UserOrderItemsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const GroupOrderWithUserOrdersSchema = z.object({
  groupOrder: GroupOrderResponseSchema,
  userOrders: z.array(UserOrderResponseSchema),
});

app.openapi(
  createRoute({
    method: 'post',
    path: '/orders',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      body: {
        content: jsonContent(CreateGroupOrderRequestSchema),
      },
    },
    responses: {
      201: {
        description: 'Group order created',
        content: jsonContent(GroupOrderResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const body = c.req.valid('json');
    const createGroupOrderUseCase = inject(CreateGroupOrderUseCase);
    const groupOrder = await createGroupOrderUseCase.execute(userId, {
      name: body.name,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });

    return c.json(
      {
        id: groupOrder.id,
        leaderId: groupOrder.leaderId,
        name: groupOrder.name ?? null,
        startDate: groupOrder.startDate.toISOString(),
        endDate: groupOrder.endDate.toISOString(),
        status: groupOrder.status,
        createdAt: groupOrder.createdAt?.toISOString(),
        updatedAt: groupOrder.updatedAt?.toISOString(),
      },
      201
    );
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/orders/{id}',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderIdSchema,
      }),
    },
    responses: {
      200: {
        description: 'Group order details',
        content: jsonContent(GroupOrderResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const getGroupOrderUseCase = inject(GetGroupOrderUseCase);
    const groupOrder = await getGroupOrderUseCase.execute(id);

    return c.json(
      {
        id: groupOrder.id,
        leaderId: groupOrder.leaderId,
        name: groupOrder.name ?? null,
        startDate: groupOrder.startDate.toISOString(),
        endDate: groupOrder.endDate.toISOString(),
        status: groupOrder.status,
        createdAt: groupOrder.createdAt?.toISOString(),
        updatedAt: groupOrder.updatedAt?.toISOString(),
      },
      200
    );
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/orders/{id}/items',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderIdSchema,
      }),
    },
    responses: {
      200: {
        description: 'Group order with user orders',
        content: jsonContent(GroupOrderWithUserOrdersSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const getGroupOrderWithUserOrdersUseCase = inject(GetGroupOrderWithUserOrdersUseCase);
    const result = await getGroupOrderWithUserOrdersUseCase.execute(id);

    return c.json(
      {
        groupOrder: {
          id: result.groupOrder.id,
          leaderId: result.groupOrder.leaderId,
          name: result.groupOrder.name ?? null,
          startDate: result.groupOrder.startDate.toISOString(),
          endDate: result.groupOrder.endDate.toISOString(),
          status: result.groupOrder.status,
          createdAt: result.groupOrder.createdAt?.toISOString(),
          updatedAt: result.groupOrder.updatedAt?.toISOString(),
        },
        userOrders: result.userOrders.map((uo) => ({
          id: uo.id,
          groupOrderId: uo.groupOrderId,
          userId: uo.userId,
          username: uo.username,
          status: uo.status,
          items: uo.items,
          createdAt: uo.createdAt.toISOString(),
          updatedAt: uo.updatedAt.toISOString(),
        })),
      },
      200
    );
  }
);

export const groupOrderRoutes = app;
