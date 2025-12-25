/**
 * Group order routes
 * @module api/routes/group-order
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { GroupOrderSchemas, jsonContent } from '@/api/schemas/group-order.schemas';
import { authSecurity, createAuthenticatedRouteApp } from '@/api/utils/route.utils';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import {
  canAcceptOrders,
  canSubmitGroupOrder,
  type GroupOrder,
  GroupOrderId,
} from '@/schemas/group-order.schema';
import { OrganizationId } from '@/schemas/organization.schema';
import { UserId } from '@/schemas/user.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { CreateGroupOrderUseCase } from '@/services/group-order/create-group-order.service';
import { DeleteGroupOrderUseCase } from '@/services/group-order/delete-group-order.service';
import { GetGroupOrderUseCase } from '@/services/group-order/get-group-order.service';
import { GetGroupOrderWithUserOrdersUseCase } from '@/services/group-order/get-group-order-with-user-orders.service';
import { UpdateGroupOrderUseCase } from '@/services/group-order/update-group-order.service';
import { UpdateGroupOrderStatusUseCase } from '@/services/group-order/update-group-order-status.service';
import { OrganizationService } from '@/services/organization/organization.service';
import { SessionService } from '@/services/session/session.service';
import { UserService } from '@/services/user/user.service';
import { RevealMysteryTacosService } from '@/services/user-order/reveal-mystery-tacos.service';
import { Currency, GroupOrderStatus } from '@/shared/types/types';
import { ForbiddenError, NotFoundError } from '@/shared/utils/errors.utils';
import { buildAvatarUrl } from '@/shared/utils/image.utils';
import { inject } from '@/shared/utils/inject.utils';
import { calculateUserOrderPrice } from '@/shared/utils/order-price.utils';

const app = createAuthenticatedRouteApp();

const UpdateGroupOrderStatusRequestSchema = z.object({
  status: z.enum([GroupOrderStatus.OPEN, GroupOrderStatus.CLOSED, GroupOrderStatus.SUBMITTED]),
});

const UpdateGroupOrderRequestSchema = z.object({
  name: z.string().nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

async function serializeGroupOrderResponse(groupOrder: GroupOrder) {
  const userService = inject(UserService);
  const leader = await userService.getUserById(groupOrder.leaderId);

  return {
    id: groupOrder.id,
    leader: {
      id: leader.id,
      name: leader.name,
      phone: leader.phone ?? null,
      image: buildAvatarUrl(leader),
    },
    name: groupOrder.name ?? null,
    startDate: groupOrder.startDate.toISOString(),
    endDate: groupOrder.endDate.toISOString(),
    status: groupOrder.status,
    canAcceptOrders: canAcceptOrders(groupOrder),
    canSubmitGroupOrder: canSubmitGroupOrder(groupOrder),
    fee: groupOrder.fee ?? null,
    createdAt: groupOrder.createdAt?.toISOString(),
    updatedAt: groupOrder.updatedAt?.toISOString(),
  };
}

/**
 * Convert price number to Amount object
 */
function toAmount(price: number) {
  return { value: price, currency: Currency.CHF };
}

/**
 * Sanitize user order items for API response
 * - Removes internal fields (tacoIdHex)
 * - Converts price numbers to Amount objects
 */
function sanitizeGroupUserOrderItems(items: UserOrder['items']) {
  return {
    tacos: items.tacos.map((taco) => {
      const { price, ...rest } = taco;
      return {
        ...rest,
        price: toAmount(price ?? 0),
      };
    }),
    extras: items.extras.map((extra) => ({
      ...extra,
      price: toAmount(extra.price ?? 0),
      free_sauce: extra.free_sauce
        ? {
            ...extra.free_sauce,
            price: toAmount(extra.free_sauce.price),
          }
        : undefined,
      free_sauces: extra.free_sauces
        ? extra.free_sauces.map((sauce) => ({
            ...sauce,
            price: toAmount(sauce.price),
          }))
        : undefined,
    })),
    drinks: items.drinks.map((drink) => ({
      ...drink,
      price: toAmount(drink.price ?? 0),
    })),
    desserts: items.desserts.map((dessert) => ({
      ...dessert,
      price: toAmount(dessert.price ?? 0),
    })),
  };
}

/**
 * Check if user has access to a group order
 * Throws ForbiddenError if user is not an active member of the organization
 */
async function requireGroupOrderAccess(groupOrderId: string, userId: string): Promise<void> {
  const groupOrderRepository = inject(GroupOrderRepository);
  const organizationService = inject(OrganizationService);

  const parsedGroupOrderId = GroupOrderId.parse(groupOrderId);
  const parsedUserId = UserId.parse(userId);

  const groupOrder = await groupOrderRepository.findById(parsedGroupOrderId);
  if (!groupOrder) {
    throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
  }

  // If group order has no organization, allow access (legacy behavior)
  if (!groupOrder.organizationId) {
    return;
  }

  // Check if user is an active member of the organization
  const parsedOrganizationId = OrganizationId.parse(groupOrder.organizationId);
  const isActiveMember = await organizationService.isUserActiveMember(
    parsedUserId,
    parsedOrganizationId
  );
  if (!isActiveMember) {
    throw new ForbiddenError();
  }
}

app.openapi(
  createRoute({
    method: 'post',
    path: '/orders',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      body: {
        content: jsonContent(GroupOrderSchemas.CreateGroupOrderRequestSchema),
      },
    },
    responses: {
      201: {
        description: 'Group order created',
        content: jsonContent(GroupOrderSchemas.GroupOrderResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = c.var.user.id;
    const requestBody = c.req.valid('json');
    const createGroupOrderUseCase = inject(CreateGroupOrderUseCase);

    const groupOrder = await createGroupOrderUseCase.execute(userId, requestBody);

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
        id: GroupOrderId,
      }),
    },
    responses: {
      200: {
        description: 'Group order details',
        content: jsonContent(GroupOrderSchemas.GroupOrderResponseSchema),
      },
      403: {
        description: 'Forbidden - User is not an active member of the organization',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
      404: {
        description: 'Group order not found',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const userId = c.var.user.id;

    await requireGroupOrderAccess(id, userId);

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
        id: GroupOrderId,
      }),
      body: {
        content: jsonContent(UpdateGroupOrderStatusRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'Group order status updated',
        content: jsonContent(GroupOrderSchemas.GroupOrderResponseSchema),
      },
      403: {
        description: 'Forbidden - User is not an active member of the organization',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
      404: {
        description: 'Group order not found',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.var.user.id;

    await requireGroupOrderAccess(id, userId);

    const updateGroupOrderStatusUseCase = inject(UpdateGroupOrderStatusUseCase);
    const groupOrder = await updateGroupOrderStatusUseCase.execute(id, userId, body.status);

    return c.json(await serializeGroupOrderResponse(groupOrder), 200);
  }
);

app.openapi(
  createRoute({
    method: 'patch',
    path: '/orders/{id}',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
      }),
      body: {
        content: jsonContent(UpdateGroupOrderRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'Group order details updated',
        content: jsonContent(GroupOrderSchemas.GroupOrderResponseSchema),
      },
      403: {
        description: 'Forbidden - User is not an active member of the organization',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
      404: {
        description: 'Group order not found',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.var.user.id;

    await requireGroupOrderAccess(id, userId);

    const updateGroupOrderUseCase = inject(UpdateGroupOrderUseCase);
    const groupOrder = await updateGroupOrderUseCase.execute(id, userId, {
      name: body.name,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });

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
        id: GroupOrderId,
      }),
    },
    responses: {
      200: {
        description: 'Group order with user orders (no payment status)',
        content: jsonContent(GroupOrderSchemas.GroupOrderWithUserOrdersItemsSchema),
      },
      403: {
        description: 'Forbidden - User is not an active member of the organization',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
      404: {
        description: 'Group order not found',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const userId = c.var.user.id;

    await requireGroupOrderAccess(id, userId);

    const getGroupOrderWithUserOrdersUseCase = inject(GetGroupOrderWithUserOrdersUseCase);
    const result = await getGroupOrderWithUserOrdersUseCase.execute(id);
    const groupOrder = await serializeGroupOrderResponse(result.groupOrder);

    // Keep mystery tacos hidden for order list (NEVER reveal)
    // No payment status needed for items endpoint
    return c.json(
      {
        groupOrder,
        userOrders: result.userOrders.map((uo) => ({
          id: uo.id,
          groupOrderId: uo.groupOrderId,
          userId: uo.userId,
          name: uo.name,
          items: sanitizeGroupUserOrderItems(uo.items),
          totalPrice: {
            value: calculateUserOrderPrice(uo.items),
            currency: Currency.CHF,
          },
          createdAt: uo.createdAt.toISOString(),
          updatedAt: uo.updatedAt.toISOString(),
        })),
      },
      200
    );
  }
);

// Separate endpoint for receipts - always reveals mystery tacos
app.openapi(
  createRoute({
    method: 'get',
    path: '/orders/{id}/receipts',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
      }),
    },
    responses: {
      200: {
        description: 'Group order with user orders (mystery tacos revealed for receipts)',
        content: jsonContent(GroupOrderSchemas.GroupOrderWithUserOrdersSchema),
      },
      403: {
        description: 'Forbidden - User is not an active member of the organization',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
      404: {
        description: 'Group order not found',
        content: jsonContent(GroupOrderSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const userId = c.var.user.id;

    await requireGroupOrderAccess(id, userId);

    const getGroupOrderWithUserOrdersUseCase = inject(GetGroupOrderWithUserOrdersUseCase);
    const result = await getGroupOrderWithUserOrdersUseCase.execute(id);
    const groupOrder = await serializeGroupOrderResponse(result.groupOrder);

    // Always reveal mystery tacos for receipts
    const revealMysteryTacosService = inject(RevealMysteryTacosService);
    const userOrdersWithRevealedMystery = await Promise.all(
      result.userOrders.map((uo) => revealMysteryTacosService.revealMysteryTacos(uo))
    );

    return c.json(
      {
        groupOrder,
        userOrders: userOrdersWithRevealedMystery.map((uo) => ({
          id: uo.id,
          groupOrderId: uo.groupOrderId,
          userId: uo.userId,
          name: uo.name,
          items: sanitizeGroupUserOrderItems(uo.items),
          totalPrice: {
            value: calculateUserOrderPrice(uo.items),
            currency: Currency.CHF,
          },
          reimbursement: {
            settled: uo.reimbursement.settled,
            settledAt: uo.reimbursement.settledAt?.toISOString() ?? null,
            settledBy: uo.reimbursement.settledBy
              ? {
                  id: uo.reimbursement.settledBy.id,
                  name: uo.reimbursement.settledBy.name ?? null,
                }
              : null,
          },
          participantPayment: {
            paid: uo.participantPayment.paid,
            paidAt: uo.participantPayment.paidAt?.toISOString() ?? null,
            paidBy: uo.participantPayment.paidBy
              ? {
                  id: uo.participantPayment.paidBy.id,
                  name: uo.participantPayment.paidBy.name ?? null,
                }
              : null,
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
        id: GroupOrderId,
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
    const userId = c.var.user.id;

    await requireGroupOrderAccess(groupOrderId, userId);

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

// Endpoint to delete a group order
app.openapi(
  createRoute({
    method: 'delete',
    path: '/orders/{id}',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
      }),
    },
    responses: {
      204: {
        description: 'Group order deleted successfully',
      },
      403: {
        description: 'Only the group order leader can delete the group order',
      },
      404: {
        description: 'Group order not found',
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const userId = c.var.user.id;

    await requireGroupOrderAccess(id, userId);

    const deleteGroupOrderUseCase = inject(DeleteGroupOrderUseCase);

    await deleteGroupOrderUseCase.execute(id, userId);

    return c.body(null, 204);
  }
);

export const groupOrderRoutes = app;
