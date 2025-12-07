import { z } from '@hono/zod-openapi';
import {
  AmountSchema,
  ErrorResponseSchema,
  IsoDateStringSchema,
} from '@/api/schemas/shared.schemas';
import { UserOrderItemsSchema } from '@/api/schemas/user-order.schemas';

export { jsonContent } from '@/api/schemas/shared.schemas';

/**
 * Create group order request schema
 */
const CreateGroupOrderRequestSchema = z.object({
  name: z.string().optional(),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  organizationId: z.uuid().optional().nullable(),
});

/**
 * Update group order request schema
 */
const UpdateGroupOrderRequestSchema = z.object({
  name: z.string().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  organizationId: z.uuid().optional().nullable(),
});

/**
 * Group order response schema
 */
const GroupOrderResponseSchema = z.object({
  id: z.string(),
  leader: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable().optional(),
  }),
  name: z.string().nullable(),
  startDate: IsoDateStringSchema,
  endDate: IsoDateStringSchema,
  status: z.string(),
  canAcceptOrders: z.boolean(),
  canSubmitGroupOrder: z.boolean(),
  fee: z.number().nullable().optional(),
  createdAt: IsoDateStringSchema.optional(),
  updatedAt: IsoDateStringSchema.optional(),
});

/**
 * User order response schema (for group order context)
 */
const UserOrderResponseSchema = z.object({
  id: z.string(),
  groupOrderId: z.string(),
  userId: z.string(),
  name: z.string().nullable().optional(),
  items: UserOrderItemsSchema,
  totalPrice: AmountSchema,
  reimbursement: z.object({
    settled: z.boolean(),
    settledAt: IsoDateStringSchema.nullable().optional(),
    settledBy: z
      .object({
        id: z.string(),
        name: z.string().nullable(),
      })
      .nullable()
      .optional(),
  }),
  participantPayment: z.object({
    paid: z.boolean(),
    paidAt: IsoDateStringSchema.nullable().optional(),
    paidBy: z
      .object({
        id: z.string(),
        name: z.string().nullable(),
      })
      .nullable()
      .optional(),
  }),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});

/**
 * Group order with user orders response schema
 */
const GroupOrderWithUserOrdersSchema = z.object({
  groupOrder: GroupOrderResponseSchema,
  userOrders: z.array(UserOrderResponseSchema),
});

export const GroupOrderSchemas = {
  CreateGroupOrderRequestSchema,
  UpdateGroupOrderRequestSchema,
  GroupOrderResponseSchema,
  UserOrderResponseSchema,
  GroupOrderWithUserOrdersSchema,
  ErrorResponseSchema,
};
