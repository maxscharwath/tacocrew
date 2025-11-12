/**
 * Group order routes
 * @module api/routes/group-order
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { GroupOrderRepository } from '../../infrastructure/repositories/group-order.repository';
import {
  canAcceptOrders,
  type GroupOrder,
  GroupOrderIdSchema,
} from '../../schemas/group-order.schema';
import { CreateGroupOrderUseCase } from '../../services/group-order/create-group-order.service';
import { GetGroupOrderUseCase } from '../../services/group-order/get-group-order.service';
import { GetGroupOrderWithUserOrdersUseCase } from '../../services/group-order/get-group-order-with-user-orders.service';
import { UpdateGroupOrderStatusUseCase } from '../../services/group-order/update-group-order-status.service';
import { SessionService } from '../../services/session/session.service';
import { UserService } from '../../services/user/user.service';
import { GroupOrderStatus } from '../../shared/types/types';
import { NotFoundError } from '../../shared/utils/errors.utils';
import { inject } from '../../shared/utils/inject.utils';
import { isValidShareCode } from '../../shared/utils/share-code.utils';
import { jsonContent } from '../schemas/shared.schemas';
import { UserOrderItemsSchema } from '../schemas/user-order.schemas';
import {
  authSecurity,
  createAuthenticatedRouteApp,
  createRouteApp,
  requireUserId,
} from '../utils/route.utils';

const app = createAuthenticatedRouteApp();

const CreateGroupOrderRequestSchema = z.object({
  name: z.string().optional(),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
});

const GroupOrderResponseSchema = z.object({
  id: z.string(),
  leader: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }),
  name: z.string().nullable(),
  shareCode: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  canAcceptOrders: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const UserOrderResponseSchema = z.object({
  id: z.string(),
  groupOrderId: z.string(),
  userId: z.string(),
  name: z.string().nullable().optional(),
  items: UserOrderItemsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const GroupOrderWithUserOrdersSchema = z.object({
  groupOrder: GroupOrderResponseSchema,
  userOrders: z.array(UserOrderResponseSchema),
});

const UpdateGroupOrderStatusRequestSchema = z.object({
  status: z.enum([GroupOrderStatus.OPEN, GroupOrderStatus.CLOSED]),
});

async function serializeGroupOrderResponse(groupOrder: GroupOrder) {
  const userService = inject(UserService);
  const leader = await userService.getUserById(groupOrder.leaderId);

  return {
    id: groupOrder.id,
    leader: {
      id: leader.id,
      name: leader.name,
    },
    name: groupOrder.name ?? null,
    shareCode: groupOrder.shareCode ?? null,
    startDate: groupOrder.startDate.toISOString(),
    endDate: groupOrder.endDate.toISOString(),
    status: groupOrder.status,
    canAcceptOrders: canAcceptOrders(groupOrder),
    createdAt: groupOrder.createdAt?.toISOString(),
    updatedAt: groupOrder.updatedAt?.toISOString(),
  };
}

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

    return c.json(await serializeGroupOrderResponse(groupOrder), 201);
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

    return c.json(await serializeGroupOrderResponse(groupOrder), 200);
  }
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/orders/{id}/status',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderIdSchema,
      }),
      body: {
        content: jsonContent(UpdateGroupOrderStatusRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'Group order status updated',
        content: jsonContent(GroupOrderResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = requireUserId(c);
    const updateGroupOrderStatusUseCase = inject(UpdateGroupOrderStatusUseCase);
    const groupOrder = await updateGroupOrderStatusUseCase.execute(id, userId, body.status);

    return c.json(await serializeGroupOrderResponse(groupOrder), 200);
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
    const groupOrder = await serializeGroupOrderResponse(result.groupOrder);

    return c.json(
      {
        groupOrder,
        userOrders: result.userOrders.map((uo) => ({
          id: uo.id,
          groupOrderId: uo.groupOrderId,
          userId: uo.userId,
          name: uo.name,
          items: {
            ...uo.items,
            tacos: uo.items.tacos,
          },
          createdAt: uo.createdAt.toISOString(),
          updatedAt: uo.updatedAt.toISOString(),
        })),
      },
      200
    );
  }
);

// Public endpoint - no authentication required
const publicApp = createRouteApp();

// Public endpoint to get group order by share code
publicApp.openapi(
  createRoute({
    method: 'get',
    path: '/orders/code/{shareCode}',
    tags: ['Orders'],
    request: {
      params: z.object({
        shareCode: z.string().min(1),
      }),
    },
    responses: {
      200: {
        description: 'Group order found by share code',
        content: jsonContent(GroupOrderResponseSchema),
      },
      404: {
        description: 'Group order not found',
      },
    },
  }),
  async (c) => {
    const { shareCode } = c.req.valid('param');

    if (!isValidShareCode(shareCode)) {
      throw new NotFoundError({
        resource: 'GroupOrder',
        shareCode,
        reason: 'Invalid share code format',
      });
    }

    const groupOrderRepository = inject(GroupOrderRepository);
    const groupOrder = await groupOrderRepository.findByShareCode(shareCode);

    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', shareCode });
    }

    return c.json(await serializeGroupOrderResponse(groupOrder), 200);
  }
);

// Public endpoint to get group order with user orders (read-only, no auth)
publicApp.openapi(
  createRoute({
    method: 'get',
    path: '/orders/{id}/public',
    tags: ['Orders'],
    request: {
      params: z.object({
        id: GroupOrderIdSchema,
      }),
    },
    responses: {
      200: {
        description: 'Group order with user orders (public)',
        content: jsonContent(GroupOrderWithUserOrdersSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const getGroupOrderWithUserOrdersUseCase = inject(GetGroupOrderWithUserOrdersUseCase);
    const result = await getGroupOrderWithUserOrdersUseCase.execute(id);
    const groupOrder = await serializeGroupOrderResponse(result.groupOrder);

    return c.json(
      {
        groupOrder,
        userOrders: result.userOrders.map((uo) => ({
          id: uo.id,
          groupOrderId: uo.groupOrderId,
          userId: uo.userId,
          name: uo.name,
          items: {
            ...uo.items,
            tacos: uo.items.tacos.map((taco) => {
              const { tacoIdHex: _tacoIdHex, ...tacoWithoutInternalFields } =
                taco as typeof taco & {
                  tacoIdHex?: string;
                };
              return {
                ...tacoWithoutInternalFields,
                tacoID: taco.tacoID,
              };
            }),
          },
          createdAt: uo.createdAt.toISOString(),
          updatedAt: uo.updatedAt.toISOString(),
        })),
      },
      200
    );
  }
);

// Endpoint to get cookies for order verification
app.openapi(
  createRoute({
    method: 'get',
    path: '/orders/{id}/cookies',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderIdSchema,
      }),
    },
    responses: {
      200: {
        description: 'Session cookies for order verification',
        content: jsonContent(
          z.object({
            cookies: z.record(z.string(), z.string()),
            csrfToken: z.string(),
            orderId: z.string().optional(),
            transactionId: z.string().optional(),
            sessionId: z.string().optional(),
            cookieString: z
              .string()
              .describe('Formatted cookie string ready for browser injection'),
            instructions: z.string().describe('Instructions for injecting cookies into browser'),
          })
        ),
      },
      404: {
        description: 'Order or session not found',
      },
    },
  }),
  async (c) => {
    const { id: groupOrderId } = c.req.valid('param');
    const groupOrderRepository = inject(GroupOrderRepository);
    const sessionService = inject(SessionService);

    // Get group order to find session ID
    const groupOrder = await groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    // Check if session ID exists
    if (!groupOrder.sessionId) {
      throw new NotFoundError({
        resource: 'SessionCookies',
        identifier: groupOrderId,
        context: 'id',
        reason: 'No session found for this order',
      });
    }

    // Get session data
    const session = await sessionService.getSession(groupOrder.sessionId);
    if (!session) {
      throw new NotFoundError({
        resource: 'SessionCookies',
        identifier: groupOrderId,
        context: 'id',
        reason: 'Session not found',
      });
    }

    // Format cookies as string for browser injection
    const cookieString = Object.entries(session.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');

    return c.json({
      cookies: session.cookies,
      csrfToken: session.csrfToken,
      sessionId: session.sessionId,
      cookieString,
      instructions:
        'Copy the cookieString and paste it into your browser console. Note: HttpOnly cookies cannot be set via JavaScript and must be set manually via DevTools.',
    });
  }
);

export const groupOrderRoutes = app;
export const publicGroupOrderRoutes = publicApp;
