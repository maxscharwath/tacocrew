import { z } from '@hono/zod-openapi';
import { ErrorResponseSchema, IsoDateStringSchema } from '@/api/schemas/shared.schemas';
import { TacoSchema } from '@/api/schemas/user-order.schemas';

export { jsonContent } from '@/api/schemas/shared.schemas';

const UserResponseSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  phone: z.string().nullable().optional(),
  language: z.string().nullable(),
  image: z.string().nullable().optional(),
  createdAt: IsoDateStringSchema.optional(),
  updatedAt: IsoDateStringSchema.optional(),
});

const UpdateUserLanguageRequestSchema = z.object({
  language: z.enum(['en', 'fr', 'de']),
});

const UpdateUserPhoneRequestSchema = z.object({
  phone: z.string().min(1).nullable(),
});

const CreateUserRequestSchema = z.object({
  username: z.string().min(2).max(50),
});

const CreateUserResponseSchema = z.object({
  user: UserResponseSchema,
  token: z.string(),
});

const DeliveryAddressSchema = z.object({
  road: z.string(),
  houseNumber: z.string().optional(),
  postcode: z.string(),
  city: z.string(),
  state: z.string().optional(),
  country: z.string().optional(),
});

const DeliveryProfileSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  contactName: z.string(),
  phone: z.string(),
  deliveryType: z.enum(['livraison', 'emporter']),
  address: DeliveryAddressSchema,
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});

const DeliveryProfileRequestSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  contactName: z.string().min(1),
  phone: z.string().min(1),
  deliveryType: z.enum(['livraison', 'emporter']),
  address: DeliveryAddressSchema,
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
  name: z.string().nullable(),
  status: z.string(),
  canAcceptOrders: z.boolean(),
  startDate: IsoDateStringSchema,
  endDate: IsoDateStringSchema,
  createdAt: IsoDateStringSchema,
  organization: z
    .object({
      id: z.string(),
      name: z.string(),
      image: z.string().nullable(),
    })
    .nullable(),
  leader: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable().optional(),
  }),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string().nullable(),
    })
  ),
});

const PreviousOrderSchema = z.object({
  tacoID: z.string(), // base58-encoded tacoID (Bitcoin-style identifier)
  orderCount: z.number(),
  lastOrderedAt: IsoDateStringSchema,
  taco: TacoSchema, // Single taco with this tacoID
  recentGroupOrderName: z.string().nullable(),
});

export const UserSchemas = {
  UserResponseSchema,
  CreateUserRequestSchema,
  CreateUserResponseSchema,
  UpdateUserLanguageRequestSchema,
  UpdateUserPhoneRequestSchema,
  UserOrderHistoryEntrySchema,
  UserGroupOrderSchema,
  PreviousOrderSchema,
  DeliveryProfileSchema,
  DeliveryProfileRequestSchema,
  ErrorResponseSchema,
};
