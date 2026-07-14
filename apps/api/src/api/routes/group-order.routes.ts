/**
 * Group order routes
 * @module api/routes/group-order
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { GroupOrderSchemas, jsonContent } from '@/api/schemas/group-order.schemas';
import { authSecurity, createAuthenticatedRouteApp } from '@/api/utils/route.utils';
import { CommandeIntegrationClient } from '@/infrastructure/api/commande-integration.client';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { toCommandeOrderStatus } from '@/schemas/commande-order-event.schema';
import {
  canAcceptOrders,
  canSubmitGroupOrder,
  type GroupOrder,
  GroupOrderId,
  getEffectiveStatus,
} from '@/schemas/group-order.schema';
import { OrganizationId } from '@/schemas/organization.schema';
import { UserId } from '@/schemas/user.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { CreateGroupOrderUseCase } from '@/services/group-order/create-group-order.service';
import { DeleteGroupOrderUseCase } from '@/services/group-order/delete-group-order.service';
import { GetGroupOrderUseCase } from '@/services/group-order/get-group-order.service';
import { GetGroupOrderWithUserOrdersUseCase } from '@/services/group-order/get-group-order-with-user-orders.service';
import { TransferGroupOrderLeaderUseCase } from '@/services/group-order/transfer-group-order-leader.service';
import { UpdateGroupOrderUseCase } from '@/services/group-order/update-group-order.service';
import { UpdateGroupOrderStatusUseCase } from '@/services/group-order/update-group-order-status.service';
import { BackendOrderSubmissionService } from '@/services/order/backend-order-submission.service';
import { CommandeOrderEventService } from '@/services/order/commande-order-event.service';
import { OrganizationService } from '@/services/organization/organization.service';
import { UserService } from '@/services/user/user.service';
import { RevealMysteryTacosService } from '@/services/user-order/reveal-mystery-tacos.service';
import { config } from '@/shared/config/app.config';
import { Currency, GroupOrderStatus } from '@/shared/types/types';
import { NotFoundError, OrganizationAccessError } from '@/shared/utils/errors.utils';
import { buildAvatarUrl } from '@/shared/utils/image.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
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

const TransferLeaderRequestSchema = z.object({
  newLeaderId: z.string().min(1),
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
    status: getEffectiveStatus(groupOrder),
    canAcceptOrders: canAcceptOrders(groupOrder),
    canSubmitGroupOrder: canSubmitGroupOrder(groupOrder),
    fee: groupOrder.fee ?? null,
    organizationId: groupOrder.organizationId ?? null,
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
    crousties: (items.crousties ?? []).map((crousty) => ({
      ...crousty,
      price: toAmount(crousty.price ?? 0),
    })),
  };
}

/**
 * Check if user has access to a group order
 * Throws OrganizationAccessError if user is not an active member of the organization
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
    throw new OrganizationAccessError(groupOrder.organizationId);
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
    method: 'patch',
    path: '/orders/{id}/leader',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
      }),
      body: {
        content: jsonContent(TransferLeaderRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'Group order leader transferred',
        content: jsonContent(GroupOrderSchemas.GroupOrderResponseSchema),
      },
      403: {
        description: 'Forbidden - Only the current leader can transfer leadership',
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

    const transferLeaderUseCase = inject(TransferGroupOrderLeaderUseCase);
    const groupOrder = await transferLeaderUseCase.execute(
      id,
      UserId.parse(userId),
      UserId.parse(body.newLeaderId)
    );

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

const OrderStatusResponseSchema = z.object({
  groupOrderId: z.string(),
  commandeOrderId: z.string().nullable(),
  status: z
    .enum([
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ])
    .nullable(),
  source: z.enum(['activePreorders', 'confirmation', 'none']),
  updatedAt: z.string().nullable(),
});

app.openapi(
  createRoute({
    method: 'get',
    path: '/orders/{id}/status',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
      }),
    },
    responses: {
      200: {
        description: 'Current commande.app status for a submitted group order',
        content: jsonContent(OrderStatusResponseSchema),
      },
      404: {
        description: 'Group order not found',
      },
    },
  }),
  async (c) => {
    const { id: groupOrderId } = c.req.valid('param');
    const groupOrderRepository = inject(GroupOrderRepository);
    const commande = inject(CommandeIntegrationClient);
    const eventService = inject(CommandeOrderEventService);

    logger.debug('order.status.poll', { groupOrderId });

    const groupOrder = await groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    const commandeOrderId = groupOrder.commandeOrderId ?? null;

    if (!commandeOrderId) {
      return c.json(
        {
          groupOrderId,
          commandeOrderId: null,
          status: null,
          source: 'none' as const,
          updatedAt: null,
        },
        200
      );
    }

    // Prefer `getActivePreorders` — cheaper, returns live kitchen state.
    // Fall back to `getOrderConfirmation` for orders no longer active.
    const preorders = await commande.getActivePreorders(config.commande.restaurantId);
    const match = preorders.find((p) => p.orderId === commandeOrderId);
    if (match) {
      logger.debug('order.status.resolved', {
        groupOrderId,
        commandeOrderId,
        status: match.status,
        source: 'activePreorders',
      });
      // Recording must never break the read path — observability failures
      // are logged inside the service and swallowed here. Unknown statuses
      // (commande.app adds them without notice) are surfaced but not recorded.
      const knownStatus = toCommandeOrderStatus(match.status);
      try {
        if (knownStatus !== null) {
          await eventService.recordIfChanged({
            commandeOrderId,
            groupOrderId,
            status: knownStatus,
            source: 'activePreorders',
            payload: match,
          });
        }
      } catch (error) {
        logger.warn('order.status.record_failed', {
          commandeOrderId,
          groupOrderId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return c.json(
        {
          groupOrderId,
          commandeOrderId,
          status: match.status,
          source: 'activePreorders' as const,
          updatedAt: match.updatedAt ?? null,
        },
        200
      );
    }

    const confirmation = await commande.getOrderConfirmation(commandeOrderId);
    logger.debug('order.status.resolved', {
      groupOrderId,
      commandeOrderId,
      status: confirmation.status ?? null,
      source: 'confirmation',
    });
    const knownConfirmationStatus = toCommandeOrderStatus(confirmation.status);
    if (knownConfirmationStatus !== null) {
      try {
        await eventService.recordIfChanged({
          commandeOrderId,
          groupOrderId,
          status: knownConfirmationStatus,
          source: 'confirmation',
          payload: confirmation,
        });
      } catch (error) {
        logger.warn('order.status.record_failed', {
          commandeOrderId,
          groupOrderId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return c.json(
      {
        groupOrderId,
        commandeOrderId,
        status: confirmation.status ?? null,
        source: 'confirmation' as const,
        updatedAt: confirmation.updatedAt ?? null,
      },
      200
    );
  }
);

const InjectionOptionSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  quantity: z.number(),
  extraPrice: z.number(),
});

const InjectionComboSchema = z.object({
  combinationId: z.string(),
  combinationName: z.string(),
  combinationPrice: z.number(),
  combinationInstanceId: z.string(),
  combinationServiceTypes: z.array(z.string()),
  isMainInCombination: z.boolean(),
});

const InjectionItemSchema = z.object({
  productId: z.string(),
  productName: z.string().optional(),
  productImage: z.string().nullish(),
  variantId: z.string().nullish(),
  quantity: z.number(),
  price: z.number(),
  options: z.array(InjectionOptionSchema),
  note: z.string().nullish(),
  combo: InjectionComboSchema.optional(),
});

const InjectionPreviewResponseSchema = z.object({
  groupOrderId: z.string(),
  restaurantId: z.string(),
  items: z.array(InjectionItemSchema),
});

app.openapi(
  createRoute({
    method: 'get',
    path: '/orders/{id}/injection-preview',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
      }),
    },
    responses: {
      200: {
        description: 'commande.app-shaped items for a group order (used by the cart-injection UI)',
        content: jsonContent(InjectionPreviewResponseSchema),
      },
      404: {
        description: 'Group order not found',
      },
    },
  }),
  async (c) => {
    const { id: groupOrderId } = c.req.valid('param');
    const groupOrderRepository = inject(GroupOrderRepository);
    const userOrderRepository = inject(UserOrderRepository);
    const backendSubmissionService = inject(BackendOrderSubmissionService);

    const groupOrder = await groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    const userOrders = await userOrderRepository.findByGroup(groupOrderId);
    const { restaurantId, items } = await backendSubmissionService.buildInjectionPreview({
      userOrders,
    });

    return c.json({ groupOrderId, restaurantId, items }, 200);
  }
);

export const groupOrderRoutes = app;
