/**
 * User order routes
 * @module api/routes/user-order
 */

import { createRoute } from '@hono/zod-openapi';
import { OrderType } from '@tacocrew/gigatacos-client';
import { z } from 'zod';
import { AmountSchema, ErrorResponseSchema, jsonContent } from '@/api/schemas/shared.schemas';
import {
  UserOrderItemsRequestSchema,
  UserOrderItemsSchema,
} from '@/api/schemas/user-order.schemas';
import { authSecurity, createAuthenticatedRouteApp } from '@/api/utils/route.utils';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { GroupOrderId } from '@/schemas/group-order.schema';
import { OrganizationId } from '@/schemas/organization.schema';
import { UserId } from '@/schemas/user.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { UserOrderId } from '@/schemas/user-order.schema';
import { SubmitGroupOrderUseCase } from '@/services/group-order/submit-group-order.service';
import { SendPaymentReminderService } from '@/services/notification/send-payment-reminder.service';
import { OrganizationService } from '@/services/organization/organization.service';
import { CreateUserOrderUseCase } from '@/services/user-order/create-user-order.service';
import { DeleteUserOrderUseCase } from '@/services/user-order/delete-user-order.service';
import { GetUserOrderUseCase } from '@/services/user-order/get-user-order.service';
import { RevealMysteryTacosService } from '@/services/user-order/reveal-mystery-tacos.service';
import { UpdateUserOrderReimbursementStatusUseCase } from '@/services/user-order/update-user-order-reimbursement.service';
import { UpdateUserOrderUserPaymentStatusUseCase } from '@/services/user-order/update-user-order-user-payment.service';
import { TimeSlotSchema } from '@/shared/types/time-slot';
import { Currency } from '@/shared/types/types';
import { ForbiddenError, NotFoundError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { calculateUserOrderPrice } from '@/shared/utils/order-price.utils';

const app = createAuthenticatedRouteApp();

const CreateUserOrderRequestSchema = z.object({
  items: UserOrderItemsRequestSchema,
});

const PaymentActorResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
});

const ReimbursementStatusResponseSchema = z.object({
  settled: z.boolean(),
  settledAt: z.string().nullish(),
  settledBy: PaymentActorResponseSchema.nullish(),
});

const ParticipantPaymentStatusResponseSchema = z.object({
  paid: z.boolean(),
  paidAt: z.string().nullish(),
  paidBy: PaymentActorResponseSchema.nullish(),
});

const UserOrderResponseSchema = z.object({
  id: z.string(),
  groupOrderId: z.string(),
  userId: z.string(),
  name: z.string().nullish(),
  username: z.string().optional(),
  items: UserOrderItemsSchema,
  totalPrice: AmountSchema,
  reimbursement: ReimbursementStatusResponseSchema,
  participantPayment: ParticipantPaymentStatusResponseSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const UpdateReimbursementRequestSchema = z.object({
  reimbursed: z.boolean(),
});

const UpdateUserPaidRequestSchema = z.object({
  paid: z.boolean(),
});

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
function sanitizeUserOrderItems(items: UserOrder['items']) {
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

function serializeUserOrderResponse(userOrder: UserOrder) {
  return {
    id: userOrder.id,
    groupOrderId: userOrder.groupOrderId,
    userId: userOrder.userId,
    name: userOrder.name ?? null,
    username: userOrder.name ?? undefined,
    items: sanitizeUserOrderItems(userOrder.items),
    totalPrice: {
      value: calculateUserOrderPrice(userOrder.items),
      currency: Currency.CHF,
    },
    reimbursement: {
      settled: userOrder.reimbursement.settled,
      settledAt: userOrder.reimbursement.settledAt?.toISOString() ?? null,
      settledBy: userOrder.reimbursement.settledBy
        ? {
            id: userOrder.reimbursement.settledBy.id,
            name: userOrder.reimbursement.settledBy.name,
          }
        : null,
    },
    participantPayment: {
      paid: userOrder.participantPayment.paid,
      paidAt: userOrder.participantPayment.paidAt?.toISOString() ?? null,
      paidBy: userOrder.participantPayment.paidBy
        ? {
            id: userOrder.participantPayment.paidBy.id,
            name: userOrder.participantPayment.paidBy.name,
          }
        : null,
    },
    createdAt: userOrder.createdAt.toISOString(),
    updatedAt: userOrder.updatedAt.toISOString(),
  };
}

app.openapi(
  createRoute({
    method: 'post',
    path: '/orders/{id}/items',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
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
      403: {
        description: 'Forbidden - User is not an active member of the organization',
        content: jsonContent(ErrorResponseSchema),
      },
      404: {
        description: 'Group order not found',
        content: jsonContent(ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = c.var.user.id;
    const { id: groupOrderId } = c.req.valid('param');
    const body = c.req.valid('json');

    // Check if user has access to the group order
    const groupOrderRepository = inject(GroupOrderRepository);
    const organizationService = inject(OrganizationService);

    const groupOrder = await groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    // If group order has an organization, verify user is an active member
    if (groupOrder.organizationId) {
      const parsedOrganizationId = OrganizationId.parse(groupOrder.organizationId);
      const parsedUserId = UserId.parse(userId);
      const isActiveMember = await organizationService.isUserActiveMember(
        parsedUserId,
        parsedOrganizationId
      );
      if (!isActiveMember) {
        throw new ForbiddenError();
      }
    }

    const createUserOrderUseCase = inject(CreateUserOrderUseCase);
    const userOrder = await createUserOrderUseCase.execute(groupOrderId, userId, body);

    return c.json(serializeUserOrderResponse(userOrder), 201);
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
        id: GroupOrderId,
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

    return c.json(serializeUserOrderResponse(userOrder), 200);
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
        id: GroupOrderId,
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
    const deleterUserId = c.var.user.id;
    const { itemId: orderId } = c.req.valid('param');
    const deleteUserOrderUseCase = inject(DeleteUserOrderUseCase);
    await deleteUserOrderUseCase.execute(orderId, deleterUserId);

    return c.body(null, 204);
  }
);

app.openapi(
  createRoute({
    method: 'patch',
    path: '/orders/{id}/items/{itemId}/reimbursement',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
        itemId: z.string(),
      }),
      body: {
        content: jsonContent(UpdateReimbursementRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'Reimbursement status updated',
        content: jsonContent(UserOrderResponseSchema),
      },
    },
  }),
  async (c) => {
    const requesterId = c.var.user.id;
    const { id: groupOrderId, itemId } = c.req.valid('param');
    const body = c.req.valid('json');
    const userOrderId = UserOrderId.parse(itemId);
    const updateReimbursementUseCase = inject(UpdateUserOrderReimbursementStatusUseCase);
    const userOrder = await updateReimbursementUseCase.execute(
      groupOrderId,
      userOrderId,
      requesterId,
      body.reimbursed
    );

    return c.json(serializeUserOrderResponse(userOrder), 200);
  }
);

app.openapi(
  createRoute({
    method: 'patch',
    path: '/orders/{id}/items/{itemId}/payment',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
        itemId: z.string(),
      }),
      body: {
        content: jsonContent(UpdateUserPaidRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'User payment status updated',
        content: jsonContent(UserOrderResponseSchema),
      },
    },
  }),
  async (c) => {
    const requesterId = c.var.user.id;
    const { id: groupOrderId, itemId } = c.req.valid('param');
    const body = c.req.valid('json');
    const userOrderId = UserOrderId.parse(itemId);
    const updatePaymentUseCase = inject(UpdateUserOrderUserPaymentStatusUseCase);
    const userOrder = await updatePaymentUseCase.execute(
      groupOrderId,
      userOrderId,
      requesterId,
      body.paid
    );

    return c.json(serializeUserOrderResponse(userOrder), 200);
  }
);

// POST /orders/{id}/items/{itemId}/reimbursement/reminder - Send payment reminder
app.openapi(
  createRoute({
    method: 'post',
    path: '/orders/{id}/items/{itemId}/reimbursement/reminder',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
        itemId: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'Payment reminder sent',
        content: jsonContent(z.object({ success: z.boolean() })),
      },
    },
  }),
  async (c) => {
    const requesterId = c.var.user.id;
    const { id: groupOrderId, itemId } = c.req.valid('param');
    const userOrderId = UserOrderId.parse(itemId);
    const sendReminderService = inject(SendPaymentReminderService);
    const result = await sendReminderService.execute(groupOrderId, userOrderId, requesterId);
    return c.json(result, 200);
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
  paymentMethod: PaymentMethodSchema,
  dryRun: z.boolean().optional().default(false),
});

app.openapi(
  createRoute({
    method: 'post',
    path: '/orders/{id}/submit',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
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
      403: {
        description: 'Forbidden - User is not an active member of the organization',
        content: jsonContent(ErrorResponseSchema),
      },
      404: {
        description: 'Group order not found',
        content: jsonContent(ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id: groupOrderId } = c.req.valid('param');
    const body = c.req.valid('json');
    const userId = c.var.user.id;

    // Check if user has access to the group order
    const groupOrderRepository = inject(GroupOrderRepository);
    const organizationService = inject(OrganizationService);

    const groupOrder = await groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    // If group order has an organization, verify user is an active member
    if (groupOrder.organizationId) {
      const parsedOrganizationId = OrganizationId.parse(groupOrder.organizationId);
      const parsedUserId = UserId.parse(userId);
      const isActiveMember = await organizationService.isUserActiveMember(
        parsedUserId,
        parsedOrganizationId
      );
      if (!isActiveMember) {
        throw new ForbiddenError();
      }
    }

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

app.openapi(
  createRoute({
    method: 'get',
    path: '/orders/{id}/items/{itemId}/reveal-mystery',
    tags: ['Orders'],
    security: authSecurity,
    request: {
      params: z.object({
        id: GroupOrderId,
        itemId: UserOrderId,
      }),
    },
    responses: {
      200: {
        description: 'User order with revealed mystery taco ingredients',
        content: jsonContent(UserOrderItemsSchema),
      },
      403: {
        description: 'Forbidden - Only the group order leader can reveal mystery tacos before submission, or anyone after submission',
        content: jsonContent(ErrorResponseSchema),
      },
      404: {
        description: 'Group order or user order not found',
        content: jsonContent(ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id: groupOrderId, itemId: userOrderId } = c.req.valid('param');
    const requesterId = c.var.user.id;

    // Get group order
    const groupOrderRepository = inject(GroupOrderRepository);
    const groupOrder = await groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    // Check permissions: leader can always reveal, or anyone if order is submitted/completed
    const isSubmitted = groupOrder.status === 'submitted' || groupOrder.status === 'completed';
    const isLeader = groupOrder.leaderId === requesterId;

    if (!isLeader && !isSubmitted) {
      throw new ForbiddenError({
        message: 'Only the group order leader can reveal mystery tacos before submission',
      });
    }

    // Get user order
    const getUserOrderUseCase = inject(GetUserOrderUseCase);
    const userOrder = await getUserOrderUseCase.execute(userOrderId);

    // Verify user order belongs to the group order
    if (userOrder.groupOrderId !== groupOrderId) {
      throw new NotFoundError({ resource: 'UserOrder', id: userOrderId });
    }

    // Reveal mystery tacos
    const revealMysteryTacosService = inject(RevealMysteryTacosService);
    const revealedOrder = await revealMysteryTacosService.revealMysteryTacos(userOrder);

    return c.json(sanitizeUserOrderItems(revealedOrder.items), 200);
  }
);

export const userOrderRoutes = app;
