import { z } from '@hono/zod-openapi';
import { schemas as validationSchemas } from '@/hono/middleware/validation';
import {
  DessertSchema,
  DrinkSchema,
  ErrorResponseSchema,
  ExtraSchema,
  IsoDateStringSchema,
  jsonContent,
  TacoSchema,
} from '@/hono/routes/shared.schemas';
import { OrderStatus, OrderType } from '@/types';

const CartIdParam = z.uuid();

const ItemIdParam = z.uuid();

const CartIdParamsSchema = z.object({
  id: CartIdParam,
});

const CartItemParamsSchema = z.object({
  id: CartIdParam,
  itemId: ItemIdParam,
});

const CategorySummarySchema = z.object({
  totalQuantity: z.number(),
  totalPrice: z.number(),
});

const CartTotalsSchema = z.object({
  quantity: z.number(),
  price: z.number(),
});

const CartSummarySchema = z.object({
  tacos: CategorySummarySchema,
  extras: CategorySummarySchema,
  boissons: CategorySummarySchema,
  desserts: CategorySummarySchema,
  total: CartTotalsSchema,
});

const CartContentsSchema = z.object({
  tacos: z.array(TacoSchema),
  extras: z.array(ExtraSchema),
  drinks: z.array(DrinkSchema),
  desserts: z.array(DessertSchema),
});

const CartWithSummarySchema = CartContentsSchema.extend({
  summary: CartSummarySchema,
});

const CreateCartResponseSchema = z.object({
  id: z.uuid(),
});

const UpdateQuantityResponseSchema = z.object({
  quantity: z.number().int().min(0),
});

const OrderDataSchema = z.object({
  status: z.enum(OrderStatus),
  type: z.enum(OrderType),
  date: IsoDateStringSchema,
  price: z.number(),
  requestedFor: z.string(),
  tacos: z.array(TacoSchema).optional(),
  extras: z.array(ExtraSchema).optional(),
  boissons: z.array(DrinkSchema).optional(),
  desserts: z.array(DessertSchema).optional(),
});

const OrderResponseSchema = z.object({
  id: z.uuid(),
  OrderData: OrderDataSchema,
});

export const CartSchemas = {
  CartIdParamsSchema: CartIdParamsSchema,
  CartItemParamsSchema: CartItemParamsSchema,
  CartWithSummarySchema,
  CartContentsSchema,
  CreateCartResponseSchema,
  UpdateQuantityResponseSchema,
  OrderResponseSchema,
  ErrorResponseSchema,
  AddTacoSchema: validationSchemas.addTaco,
  UpdateTacoQuantitySchema: validationSchemas.updateTacoQuantity,
  AddExtraSchema: validationSchemas.addExtra,
  AddDrinkSchema: validationSchemas.addDrink,
  AddDessertSchema: validationSchemas.addDessert,
  CreateOrderSchema: validationSchemas.createOrder,
};

export const CartSecurity: [] = [];
export { jsonContent };
