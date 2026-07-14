import { z } from 'zod';
import type { Order, OrderItem, OrderItemOption } from '../types';

// Wire tolerance: commande.app introduces statuses / service types / payment
// methods without notice (production already ships `printed`, which our first
// enum did not know about). Parse them as non-empty strings and let consumers
// narrow against the exported known-value lists in types.ts.
export const orderStatusSchema = z.string().min(1);
export const serviceTypeSchema = z.string().min(1);
export const paymentMethodSchema = z.string().min(1);

// commande.app serializes Prisma Decimal columns to strings ("61", "2.5").
// Accept both plain numbers and numeric strings, always yielding a number.
const decimalSchema = z.union([
  z.number(),
  z.string().transform((s, ctx) => {
    const n = Number(s);
    if (s.trim() === '' || !Number.isFinite(n)) {
      ctx.addIssue({
        code: 'custom',
        message: `Expected numeric string, got "${s}"`,
      });
      return z.NEVER;
    }
    return n;
  }),
]);

export const orderItemOptionSchema = z
  .object({
    groupId: z.string(),
    groupName: z.string(),
    itemId: z.string(),
    itemName: z.string(),
    quantity: z.number().int().positive(),
    extraPrice: decimalSchema.nullish(),
    groupOrder: z.number().int().optional(),
    itemOrder: z.number().int().optional(),
  })
  .transform(
    (raw): OrderItemOption => ({
      groupId: raw.groupId,
      groupName: raw.groupName,
      itemId: raw.itemId,
      itemName: raw.itemName,
      quantity: raw.quantity,
      extraPrice: raw.extraPrice ?? 0,
      ...(raw.groupOrder !== undefined && { groupOrder: raw.groupOrder }),
      ...(raw.itemOrder !== undefined && { itemOrder: raw.itemOrder }),
    })
  );

// Real order rows carry `productName: null` plus a nested `product: {name}`;
// normalize so consumers always get the best available name on `productName`.
export const orderItemSchema = z
  .object({
    productId: z.string(),
    productName: z.string().nullish(),
    product: z.object({ name: z.string() }).partial().nullish(),
    quantity: z.number().int().positive(),
    price: decimalSchema,
    options: z.array(orderItemOptionSchema).nullish(),
    variantId: z.string().nullish(),
    note: z.string().nullish(),
    combinationId: z.string().nullish(),
    combinationInstanceId: z.string().nullish(),
  })
  .transform((raw): OrderItem => {
    const productName = raw.productName ?? raw.product?.name ?? null;
    return {
      productId: raw.productId,
      productName,
      quantity: raw.quantity,
      price: raw.price,
      options: raw.options ?? [],
      variantId: raw.variantId ?? null,
      note: raw.note ?? null,
      combinationId: raw.combinationId ?? null,
      combinationInstanceId: raw.combinationInstanceId ?? null,
    };
  });

export const createOrderInputSchema = z.object({
  restaurantId: z.string(),
  serviceType: serviceTypeSchema,
  items: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string().optional(),
        quantity: z.number().int().positive(),
        price: z.number(),
        options: z.array(
          z.object({
            groupId: z.string(),
            groupName: z.string(),
            itemId: z.string(),
            itemName: z.string(),
            quantity: z.number().int().positive(),
            extraPrice: z.number(),
            groupOrder: z.number().int().optional(),
            itemOrder: z.number().int().optional(),
          })
        ),
        variantId: z.string().nullish(),
        note: z.string().nullish(),
        combinationId: z.string().nullish(),
        combinationInstanceId: z.string().nullish(),
      })
    )
    .min(1),
  total: z.number().nonnegative(),
  isPreorder: z.boolean(),
  // commande.app's tRPC procedure expects `Date` (z.date()), and our envelope
  // encoder ships Date instances as superjson Date entries on the wire. Accept
  // ISO strings too so JSON-loaded fixtures and legacy callers keep working.
  pickupTime: z.coerce.date().optional(),
  pickupEndTime: z.coerce.date().optional(),
  dineIn: z.boolean(),
  isOnSite: z.boolean(),
  deliveryFee: z.number().nonnegative(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  guestDeliveryAddress: z.string().nullish(),
  paymentMethod: paymentMethodSchema,
  stripePaymentIntentId: z.string().nullish(),
  addressId: z.string().nullish(),
  deliveryNote: z.string().optional(),
  deliveryNotes: z.string().optional(),
  acceptedMinimum: z.boolean().optional(),
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
    total: decimalSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
  })
  .passthrough();

export const createOrderResponseSchema = rawCreateOrderResponseSchema.transform((raw, ctx) => {
  const orderId = raw.orderId ?? raw.id;
  if (!orderId) {
    ctx.addIssue({
      code: 'custom',
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

// The real `order.getOrderConfirmation` / `order.getActivePreorders` payload
// is the raw Prisma order row (captured 2026-07 via HAR): `id` not `orderId`,
// `orderType` alongside `serviceType`, Decimal columns as strings, timestamps
// as ISO strings. Normalize into the stable public `Order` shape.
const wireOrderSchema = z
  .object({
    id: z.string().optional(),
    orderId: z.string().optional(),
    restaurantId: z.string(),
    status: orderStatusSchema,
    serviceType: serviceTypeSchema.optional(),
    orderType: z.string().nullish(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
    items: z.array(orderItemSchema).nullish(),
    total: decimalSchema.optional(),
    totalAmount: decimalSchema.optional(),
    deliveryFee: decimalSchema.nullish(),
    customerName: z.string().nullish(),
    customerPhone: z.string().nullish(),
    guestDeliveryAddress: z.string().nullish(),
    paymentMethod: paymentMethodSchema.nullish(),
    pickupTime: z.string().nullish(),
    pickupEndTime: z.string().nullish(),
    eta: z.string().nullish(),
    estimatedMinutes: z.number().nullish(),
    isPaid: z.boolean().optional(),
    cancellationReason: z.string().nullish(),
    statusTimestamps: z.record(z.string(), z.string()).nullish(),
  })
  .passthrough();

export const orderSchema = wireOrderSchema.transform((raw, ctx): Order => {
  const orderId = raw.orderId ?? raw.id;
  if (!orderId) {
    ctx.addIssue({
      code: 'custom',
      path: ['orderId'],
      message: 'order payload is missing both `orderId` and `id`',
    });
    return z.NEVER;
  }
  const totalAmount = raw.totalAmount ?? raw.total;
  if (totalAmount === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['totalAmount'],
      message: 'order payload is missing both `totalAmount` and `total`',
    });
    return z.NEVER;
  }
  const serviceType = raw.serviceType ?? raw.orderType;
  if (serviceType === undefined || serviceType === null) {
    ctx.addIssue({
      code: 'custom',
      path: ['serviceType'],
      message: 'order payload is missing both `serviceType` and `orderType`',
    });
    return z.NEVER;
  }
  return {
    orderId,
    restaurantId: raw.restaurantId,
    status: raw.status,
    serviceType,
    createdAt: raw.createdAt,
    ...(raw.updatedAt != null && { updatedAt: raw.updatedAt }),
    items: raw.items ?? [],
    totalAmount,
    ...(raw.deliveryFee != null && { deliveryFee: raw.deliveryFee }),
    ...(raw.customerName != null && { customerName: raw.customerName }),
    ...(raw.customerPhone != null && { customerPhone: raw.customerPhone }),
    guestDeliveryAddress: raw.guestDeliveryAddress ?? null,
    ...(raw.paymentMethod != null && { paymentMethod: raw.paymentMethod }),
    pickupTime: raw.pickupTime ?? null,
    pickupEndTime: raw.pickupEndTime ?? null,
    eta: raw.eta ?? null,
    estimatedMinutes: raw.estimatedMinutes ?? null,
    ...(raw.isPaid !== undefined && { isPaid: raw.isPaid }),
    cancellationReason: raw.cancellationReason ?? null,
    ...(raw.statusTimestamps != null && { statusTimestamps: raw.statusTimestamps }),
  };
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
