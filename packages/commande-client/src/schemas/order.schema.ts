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

export const createOrderResponseSchema = z.object({
  orderId: z.string(),
  transactionId: z.string().nullish(),
  total: z.number().optional(),
  paymentMethod: paymentMethodSchema.optional(),
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
