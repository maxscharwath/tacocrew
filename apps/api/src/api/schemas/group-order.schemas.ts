import { z } from '@hono/zod-openapi';
import { AmountSchema, ErrorResponseSchema } from '@/api/schemas/shared.schemas';
import { UserOrderItemsSchema } from '@/api/schemas/user-order.schemas';
import { OrganizationId } from '@/schemas/organization.schema';

export { jsonContent } from '@/api/schemas/shared.schemas';

/**
 * Create group order request schema
 */
const CreateGroupOrderRequestSchema = z.object({
  name: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  organizationId: OrganizationId,
});

/**
 * Update group order request schema
 */
const UpdateGroupOrderRequestSchema = z.object({
  name: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
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
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.string(),
  canAcceptOrders: z.boolean(),
  canSubmitGroupOrder: z.boolean(),
  fee: z.number().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
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
    settledAt: z.coerce.date().nullable().optional(),
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
    paidAt: z.coerce.date().nullable().optional(),
    paidBy: z
      .object({
        id: z.string(),
        name: z.string().nullable(),
      })
      .nullable()
      .optional(),
  }),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
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
