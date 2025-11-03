import { z } from '@hono/zod-openapi';
import { schemas as validationSchemas } from '@/hono/middleware/validation';
import {
  DessertSchema,
  DrinkSchema,
  ErrorResponseSchema,
  ExtraSchema,
  IsoDateSchema,
  IsoDateStringSchema,
  TacoSchema,
  UserOrderItemsSchema,
} from '@/hono/routes/shared.schemas';
import { GroupOrderStatus, UserOrderStatus } from '@/types';

const CreateGroupOrderSchema = z.object({
  name: z.string().trim().min(1).optional(),
  startDate: IsoDateSchema,
  endDate: IsoDateSchema,
});

const UpdateGroupOrderSchema = CreateGroupOrderSchema.partial().extend({
  startDate: IsoDateSchema.optional(),
  endDate: IsoDateSchema.optional(),
});

const UpdateUserOrderSchema = z.object({
  items: UserOrderItemsSchema,
});

const GroupOrderResponseSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  leaderId: z.string(),
  startDate: IsoDateStringSchema,
  endDate: IsoDateStringSchema,
  status: z.enum(GroupOrderStatus),
  createdAt: IsoDateStringSchema.optional(),
  updatedAt: IsoDateStringSchema.optional(),
});

const UserOrderResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string().optional(),
  status: z.enum(UserOrderStatus),
  items: UserOrderItemsSchema,
  createdAt: IsoDateStringSchema.optional(),
  updatedAt: IsoDateStringSchema.optional(),
});

const GroupOrderWithOrdersSchema = GroupOrderResponseSchema.extend({
  userOrders: z.array(UserOrderResponseSchema),
});

const UserOrderListSchema = z.array(UserOrderResponseSchema);

const SubmitGroupOrderResultSchema = z.object({
  orderId: z.uuid(),
  cartId: z.uuid(),
});

import { zId } from '@/domain/entities/branded-types';
import type { GroupOrderId } from '@/domain/schemas/group-order.schema';
import type { UserId } from '@/domain/schemas/user.schema';

const GroupOrderIdParam = zId<GroupOrderId>();

const GroupOrderIdParamsSchema = z.object({
  id: GroupOrderIdParam,
});

const UserIdParam = zId<UserId>();

const GroupOrderAndUserIdParamsSchema = GroupOrderIdParamsSchema.extend({
  userId: UserIdParam,
});

const SubmitGroupOrderRequestSchema = validationSchemas.createOrder;

export const GroupOrderSchemas = {
  CreateGroupOrderSchema,
  UpdateGroupOrderSchema,
  UpdateUserOrderSchema,
  TacoSchema,
  ExtraSchema,
  DrinkSchema,
  DessertSchema,
  UserOrderItemsSchema,
  GroupOrderResponseSchema,
  GroupOrderWithOrdersSchema,
  UserOrderResponseSchema,
  UserOrderListSchema,
  SubmitGroupOrderResultSchema,
  ErrorResponseSchema,
  GroupOrderIdParamsSchema,
  GroupOrderAndUserIdParamsSchema,
  SubmitGroupOrderRequestSchema,
};

export const GroupOrderSecurity = [{ BearerAuth: [] as string[] }] as const;
