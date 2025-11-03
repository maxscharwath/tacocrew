import { z } from '@hono/zod-openapi';
import {
  ErrorResponseSchema,
  IsoDateStringSchema,
  jsonContent,
} from '@/hono/routes/shared.schemas';

const UserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  slackId: z.string().optional(),
  createdAt: IsoDateStringSchema.optional(),
  updatedAt: IsoDateStringSchema.optional(),
});

const CreateUserRequestSchema = z.object({
  username: z.string().min(2).max(50),
});

const CreateUserResponseSchema = z.object({
  user: UserResponseSchema,
  token: z.string(),
});

const UserOrderHistoryEntrySchema = z.object({
  id: z.string(),
  orderId: z.string(),
  status: z.string(),
  price: z.number().nullable(),
  orderType: z.string(),
  requestedFor: z.string(),
  createdAt: IsoDateStringSchema,
});

const UserGroupOrderSchema = z.object({
  id: z.string(),
  groupOrderId: z.string(),
  name: z.string().nullable(),
  status: z.string(),
  startDate: IsoDateStringSchema,
  endDate: IsoDateStringSchema,
  createdAt: IsoDateStringSchema,
});

export const UserSchemas = {
  UserResponseSchema,
  CreateUserRequestSchema,
  CreateUserResponseSchema,
  UserOrderHistoryEntrySchema,
  UserGroupOrderSchema,
  ErrorResponseSchema,
};

export { jsonContent };
