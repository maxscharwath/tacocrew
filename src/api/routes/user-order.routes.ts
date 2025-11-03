/**
 * User order routes
 * @module api/routes/user-order
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { jsonContent } from '@/api/schemas/shared.schemas';
import {
  UserOrderItemsRequestSchema,
  UserOrderItemsSchema,
} from '@/api/schemas/user-order.schemas';
import { authSecurity, createAuthenticatedRouteApp, requireUserId } from '@/api/utils/route.utils';
import { GroupOrderIdSchema } from '@/schemas/group-order.schema';
import { UserIdSchema } from '@/schemas/user.schema';
import { SubmitGroupOrderUseCase } from '@/services/group-order/submit-group-order.service';
import { CreateUserOrderUseCase } from '@/services/user-order/create-user-order.service';
import { DeleteUserOrderUseCase } from '@/services/user-order/delete-user-order.service';
import { GetUserOrderUseCase } from '@/services/user-order/get-user-order.service';
import { TimeSlotSchema } from '@/shared/types/time-slot';
import { OrderType } from '@/shared/types/types';
import { inject } from '@/shared/utils/inject.utils';

const app = createAuthenticatedRouteApp();

const CreateUserOrderRequestSchema = z.object({
  items: UserOrderItemsRequestSchema,
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

app.openapi(
  createRoute({
    method: 'post',
    path: '/orders/{id}/items',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderIdSchema,
      }),
      body: {
        content: jsonContent(CreateUserOrderRequestSchema),
      },
    },
    responses: {
      201: {
        description: 'User order created or updated',
        content: jsonContent(UserOrderResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id: groupOrderId } = c.req.valid('param');
    const body = c.req.valid('json');
    const createUserOrderUseCase = inject(CreateUserOrderUseCase);
    const userOrder = await createUserOrderUseCase.execute(groupOrderId, userId, body);

    return c.json(
      {
        id: userOrder.id,
        groupOrderId: userOrder.groupOrderId,
        userId: userOrder.userId,
        username: userOrder.username,
        status: userOrder.status,
        items: userOrder.items,
        createdAt: userOrder.createdAt.toISOString(),
        updatedAt: userOrder.updatedAt.toISOString(),
      },
      201
    );
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/orders/{id}/items/{itemId}',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderIdSchema,
        itemId: UserIdSchema,
      }),
    },
    responses: {
      200: {
        description: 'User order details',
        content: jsonContent(UserOrderResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id: groupOrderId, itemId: userId } = c.req.valid('param');
    const getUserOrderUseCase = inject(GetUserOrderUseCase);
    const userOrder = await getUserOrderUseCase.execute(groupOrderId, userId);

    return c.json(
      {
        id: userOrder.id,
        groupOrderId: userOrder.groupOrderId,
        userId: userOrder.userId,
        username: userOrder.username,
        status: userOrder.status,
        items: userOrder.items,
        createdAt: userOrder.createdAt.toISOString(),
        updatedAt: userOrder.updatedAt.toISOString(),
      },
      200
    );
  }
);

app.openapi(
  createRoute({
    method: 'delete',
    path: '/orders/{id}/items/{itemId}',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderIdSchema,
        itemId: UserIdSchema,
      }),
    },
    responses: {
      204: {
        description: 'User order deleted',
      },
    },
  }),
  async (c) => {
    const deleterUserId = requireUserId(c);
    const { id: groupOrderId, itemId: userId } = c.req.valid('param');
    const deleteUserOrderUseCase = inject(DeleteUserOrderUseCase);
    await deleteUserOrderUseCase.execute(groupOrderId, userId, deleterUserId);

    return c.body(null, 204);
  }
);

const SubmitGroupOrderRequestSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
  }),
  delivery: z.object({
    type: z.enum(['livraison', 'emporter']),
    address: z.string().min(1),
    requestedFor: TimeSlotSchema,
  }),
});

app.openapi(
  createRoute({
    method: 'post',
    path: '/orders/{id}/submit',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderIdSchema,
      }),
      body: {
        content: jsonContent(SubmitGroupOrderRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'Group order submitted',
        content: jsonContent(
          z.object({
            groupOrderId: z.string(),
            submittedCount: z.number(),
            orderId: z.string(),
            transactionId: z.string(),
          })
        ),
      },
    },
  }),
  async (c) => {
    const { id: groupOrderId } = c.req.valid('param');
    const body = c.req.valid('json');
    const submitGroupOrderUseCase = inject(SubmitGroupOrderUseCase);
    const result = await submitGroupOrderUseCase.execute(groupOrderId, body.customer, {
      type: body.delivery.type === 'livraison' ? OrderType.DELIVERY : OrderType.TAKEAWAY,
      address: body.delivery.address,
      requestedFor: body.delivery.requestedFor,
    });

    return c.json(
      {
        groupOrderId: result.groupOrderId,
        submittedCount: result.submittedCount,
        orderId: result.orderId,
        transactionId: result.transactionId,
      },
      200
    );
  }
);

export const userOrderRoutes = app;
