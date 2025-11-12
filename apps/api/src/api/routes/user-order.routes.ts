/**
 * User order routes
 * @module api/routes/user-order
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { GroupOrderIdSchema } from '../../schemas/group-order.schema';
import { SubmitGroupOrderUseCase } from '../../services/group-order/submit-group-order.service';
import { CreateUserOrderUseCase } from '../../services/user-order/create-user-order.service';
import { DeleteUserOrderUseCase } from '../../services/user-order/delete-user-order.service';
import { GetUserOrderUseCase } from '../../services/user-order/get-user-order.service';
import { TimeSlotSchema } from '../../shared/types/time-slot';
import { OrderType } from '../../shared/types/types';
import { inject } from '../../shared/utils/inject.utils';
import { jsonContent } from '../schemas/shared.schemas';
import { UserOrderItemsRequestSchema, UserOrderItemsSchema } from '../schemas/user-order.schemas';
import { authSecurity, createAuthenticatedRouteApp, requireUserId } from '../utils/route.utils';

const app = createAuthenticatedRouteApp();

const CreateUserOrderRequestSchema = z.object({
  items: UserOrderItemsRequestSchema,
});

const UserOrderResponseSchema = z.object({
  id: z.string(),
  groupOrderId: z.string(),
  userId: z.string(),
  username: z.string().optional(),
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
        name: userOrder.name,
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
        itemId: z.string(), // Order ID, not userId
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
    const { itemId: orderId } = c.req.valid('param');
    const getUserOrderUseCase = inject(GetUserOrderUseCase);
    const userOrder = await getUserOrderUseCase.execute(orderId);

    return c.json(
      {
        id: userOrder.id,
        groupOrderId: userOrder.groupOrderId,
        userId: userOrder.userId,
        name: userOrder.name,
        items: {
          ...userOrder.items,
          tacos: userOrder.items.tacos.map((taco) => {
            const { tacoIdHex: _tacoIdHex, ...tacoWithoutInternalFields } = taco as typeof taco & {
              tacoIdHex?: string;
            };
            return {
              ...tacoWithoutInternalFields,
              tacoID: taco.tacoID,
            };
          }),
        },
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
        itemId: z.string(), // Order ID, not userId
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
    const { itemId: orderId } = c.req.valid('param');
    const deleteUserOrderUseCase = inject(DeleteUserOrderUseCase);
    await deleteUserOrderUseCase.execute(orderId, deleterUserId);

    return c.body(null, 204);
  }
);

const StructuredAddressSchema = z.object({
  road: z.string().min(1),
  house_number: z.string().optional(),
  postcode: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().optional(),
});

const PaymentMethodSchema = z
  .enum(['especes', 'carte', 'twint'])
  .describe('Payment method: especes (cash), carte (card), or twint');

const SubmitGroupOrderRequestSchema = z.object({
  customer: z.object({
    name: z.string().min(1), // Can be person name or company/enterprise name
    phone: z.string().min(1),
  }),
  delivery: z.object({
    type: z.enum(OrderType),
    address: StructuredAddressSchema,
    requestedFor: TimeSlotSchema,
  }),
  paymentMethod: PaymentMethodSchema.optional(),
  dryRun: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'If true, skips actual submission to RocknRoll.php but creates session and cart for testing'
    ),
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
            dryRun: z.boolean().optional(),
          })
        ),
      },
    },
  }),
  async (c) => {
    const { id: groupOrderId } = c.req.valid('param');
    const body = c.req.valid('json');
    const submitGroupOrderUseCase = inject(SubmitGroupOrderUseCase);
    const result = await submitGroupOrderUseCase.execute(
      groupOrderId,
      body.customer,
      body.delivery,
      body.paymentMethod,
      body.dryRun ?? false
    );

    return c.json(
      {
        groupOrderId: result.groupOrderId,
        submittedCount: result.submittedCount,
        orderId: result.orderId,
        transactionId: result.transactionId,
        ...(result.dryRun && { dryRun: true }),
      },
      200
    );
  }
);

export const userOrderRoutes = app;
