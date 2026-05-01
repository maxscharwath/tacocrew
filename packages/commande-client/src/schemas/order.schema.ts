import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS, SERVICE_TYPES } from '../types';

export const orderStatusSchema = z.enum([...ORDER_STATUSES]);
export const serviceTypeSchema = z.enum([...SERVICE_TYPES]);
export const paymentMethodSchema = z.enum([...PAYMENT_METHODS]);

export const orderItemOptionSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  quantity: z.number().int().positive(),
  extraPrice: z.number(),
});

export const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string().optional(),
  quantity: z.number().int().positive(),
  price: z.number(),
  options: z.array(orderItemOptionSchema),
  variantId: z.string().nullish(),
  note: z.string().nullish(),
});

export const createOrderInputSchema = z.object({
  restaurantId: z.string(),
  serviceType: serviceTypeSchema,
  items: z.array(orderItemSchema).min(1),
  total: z.number().nonnegative(),
  isPreorder: z.boolean(),
  pickupTime: z.string().optional(),
  pickupEndTime: z.string().optional(),
  dineIn: z.boolean(),
  isOnSite: z.boolean(),
  deliveryFee: z.number().nonnegative(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  guestDeliveryAddress: z.string().nullish(),
  paymentMethod: paymentMethodSchema,
  stripePaymentIntentId: z.string().nullish(),
});

// commande.app returns `order.create` with shape variants observed in
// production: `orderId` may be named `id`, and `total` arrives as a
// Prisma Decimal serialized to string. Normalize both before consumers
// see them so the public type stays stable.
const rawCreateOrderResponseSchema = z
  .object({
    orderId: z.string().optional(),
    id: z.string().optional(),
    transactionId: z.string().nullish(),
    total: z
      .union([
        z.number(),
        z.string().transform((s, ctx) => {
          const n = Number(s);
          if (!Number.isFinite(n)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Expected numeric string for total, got "${s}"`,
            });
            return z.NEVER;
          }
          return n;
        }),
      ])
      .optional(),
    paymentMethod: paymentMethodSchema.optional(),
  })
  .passthrough();

export const createOrderResponseSchema = rawCreateOrderResponseSchema.transform((raw, ctx) => {
  const orderId = raw.orderId ?? raw.id;
  if (!orderId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['orderId'],
      message: 'order.create response is missing both `orderId` and `id`',
    });
    return z.NEVER;
  }
  return {
    orderId,
    transactionId: raw.transactionId ?? null,
    total: raw.total,
    paymentMethod: raw.paymentMethod,
  };
});

export const orderSchema = z.object({
  orderId: z.string(),
  restaurantId: z.string(),
  status: orderStatusSchema,
  serviceType: serviceTypeSchema,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  items: z.array(orderItemSchema),
  totalAmount: z.number(),
  deliveryFee: z.number().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  guestDeliveryAddress: z.string().nullish(),
  paymentMethod: paymentMethodSchema.optional(),
  pickupTime: z.string().nullish(),
  pickupEndTime: z.string().nullish(),
  eta: z.string().nullish(),
});

export const activePreorderListSchema = z.array(orderSchema);

// Keep permissive: the real commande.app response ships a large
// restaurant-metadata payload (address, phone, opening hours, …). We surface
// only the fields the integration layer actually reads.
export const restaurantStatusSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    acceptingOrders: z.boolean(),
    prepTimeMinutes: z.number().int().nonnegative().nullish(),
    prepTimeDelivery: z.number().int().nonnegative().nullish(),
    minPreorderMinutes: z.number().int().nonnegative().nullish(),
    serviceType: z.string().nullish(),
    isDemo: z.boolean().nullish(),
  })
  .passthrough();

export const potentialOrderResultSchema = z.object({
  success: z.boolean(),
});
