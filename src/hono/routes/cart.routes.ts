/**
 * Cart routes for Hono
 * @module hono/routes/cart
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { CartIdSchema } from '@/domain/schemas/cart.schema';
import { DessertIdSchema } from '@/domain/schemas/dessert.schema';
import { DrinkIdSchema } from '@/domain/schemas/drink.schema';
import { ExtraIdSchema } from '@/domain/schemas/extra.schema';
import { SessionIdSchema } from '@/domain/schemas/session.schema';
import { optionalAuthMiddleware } from '@/hono/middleware/auth';
import { CartSchemas, CartSecurity, jsonContent } from '@/hono/routes/cart.schemas';
import { DessertSchema, DrinkSchema, ExtraSchema, TacoSchema } from '@/hono/routes/shared.schemas';
import { CartService } from '@/services/cart.service';
import { OrderService } from '@/services/order.service';
import { OrderStatus, OrderType, StockCategory, TacoSize, UpdateTacoRequest } from '@/types';
import { inject } from '@/utils/inject';
import { deterministicUUID } from '@/utils/uuid-utils';

const app = new OpenAPIHono();

// Optional auth for cart routes (to link orders to users when authenticated)
app.use('*', optionalAuthMiddleware);

app.openapi(
  createRoute({
    method: 'post',
    path: '/carts',
    tags: ['Cart'],
    security: CartSecurity,
    responses: {
      201: {
        description: 'Cart created',
        content: jsonContent(CartSchemas.CreateCartResponseSchema),
      },
      400: {
        description: 'Invalid request',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id } = await cartService.createCart({
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '',
      userAgent: c.req.header('user-agent') || '',
    });
    return c.json({ id }, 201);
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/carts/{id}',
    tags: ['Cart'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartIdParamsSchema,
    },
    responses: {
      200: {
        description: 'Cart contents with summary',
        content: jsonContent(CartSchemas.CartWithSummarySchema),
      },
      404: {
        description: 'Cart not found',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    const cart = await cartService.getCartWithSummary(cartId);
    return c.json(cart, 200);
  }
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/carts/{id}/tacos',
    tags: ['Cart Tacos'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartIdParamsSchema,
      body: {
        content: jsonContent(CartSchemas.AddTacoSchema),
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Taco added to cart',
        content: jsonContent(TacoSchema),
      },
      400: {
        description: 'Invalid taco payload',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    const body = c.req.valid('json');
    const taco = await cartService.addTaco(cartId, body);
    return c.json(taco, 201);
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/carts/{id}/tacos/{itemId}',
    tags: ['Cart Tacos'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartItemParamsSchema,
    },
    responses: {
      200: {
        description: 'Taco details',
        content: jsonContent(TacoSchema),
      },
      404: {
        description: 'Taco not found',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id, itemId } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    const taco = await cartService.getTacoDetails(cartId, itemId);
    return c.json(taco, 200);
  }
);

app.openapi(
  createRoute({
    method: 'put',
    path: '/carts/{id}/tacos/{itemId}',
    tags: ['Cart Tacos'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartItemParamsSchema,
      body: {
        content: jsonContent(CartSchemas.AddTacoSchema),
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Updated taco',
        content: jsonContent(TacoSchema),
      },
      400: {
        description: 'Invalid taco payload',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id, itemId } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    const body = c.req.valid('json');
    const request = { ...body, id: itemId } as UpdateTacoRequest;
    const taco = await cartService.updateTaco(cartId, request);
    return c.json(taco, 200);
  }
);

app.openapi(
  createRoute({
    method: 'patch',
    path: '/carts/{id}/tacos/{itemId}/quantity',
    tags: ['Cart Tacos'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartItemParamsSchema,
      body: {
        content: jsonContent(CartSchemas.UpdateTacoQuantitySchema),
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Updated taco quantity',
        content: jsonContent(CartSchemas.UpdateQuantityResponseSchema),
      },
      400: {
        description: 'Invalid quantity payload',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id, itemId } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    const { action } = c.req.valid('json');
    const result = await cartService.updateTacoQuantity(cartId, itemId, action);
    return c.json(result, 200);
  }
);

app.openapi(
  createRoute({
    method: 'delete',
    path: '/carts/{id}/tacos/{itemId}',
    tags: ['Cart Tacos'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartItemParamsSchema,
    },
    responses: {
      204: {
        description: 'Taco removed from cart',
      },
      404: {
        description: 'Taco not found',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id, itemId } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    await cartService.deleteTaco(cartId, itemId);
    return c.body(null, 204);
  }
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/carts/{id}/extras',
    tags: ['Cart Items'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartIdParamsSchema,
      body: {
        content: jsonContent(CartSchemas.AddExtraSchema),
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Extra added to cart',
        content: jsonContent(ExtraSchema),
      },
      400: {
        description: 'Invalid extra payload',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    const body = c.req.valid('json');
    // API sends id as code, generate deterministic UUID for id
    const extra = {
      id: ExtraIdSchema.parse(deterministicUUID(body.id, StockCategory.Extras)),
      code: body.id,
      name: body.name,
      price: body.price,
      quantity: body.quantity,
      ...(body.free_sauce && { free_sauce: body.free_sauce }),
      ...(body.free_sauces && { free_sauces: body.free_sauces }),
    };
    const result = await cartService.addExtra(cartId, extra);
    return c.json(result, 201);
  }
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/carts/{id}/drinks',
    tags: ['Cart Items'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartIdParamsSchema,
      body: {
        content: jsonContent(CartSchemas.AddDrinkSchema),
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Drink added to cart',
        content: jsonContent(DrinkSchema),
      },
      400: {
        description: 'Invalid drink payload',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    const body = c.req.valid('json');
    // API sends id as code, generate deterministic UUID for id
    const drink = {
      id: DrinkIdSchema.parse(deterministicUUID(body.id, StockCategory.Drinks)),
      code: body.id,
      name: body.name,
      price: body.price,
      quantity: body.quantity,
    };
    const result = await cartService.addDrink(cartId, drink);
    return c.json(result, 201);
  }
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/carts/{id}/desserts',
    tags: ['Cart Items'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartIdParamsSchema,
      body: {
        content: jsonContent(CartSchemas.AddDessertSchema),
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Dessert added to cart',
        content: jsonContent(DessertSchema),
      },
      400: {
        description: 'Invalid dessert payload',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const cartService = inject(CartService);
    const { id } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    const body = c.req.valid('json');
    // API sends id as code, generate deterministic UUID for id
    const dessert = {
      id: DessertIdSchema.parse(deterministicUUID(body.id, StockCategory.Desserts)),
      code: body.id,
      name: body.name,
      price: body.price,
      quantity: body.quantity,
    };
    const result = await cartService.addDessert(cartId, dessert);
    return c.json(result, 201);
  }
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/carts/{id}/orders',
    tags: ['Orders'],
    security: CartSecurity,
    request: {
      params: CartSchemas.CartIdParamsSchema,
      body: {
        content: jsonContent(CartSchemas.CreateOrderSchema),
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Order created',
        content: jsonContent(CartSchemas.OrderResponseSchema),
      },
      400: {
        description: 'Invalid order payload',
        content: jsonContent(CartSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const orderService = inject(OrderService);
    const { id } = c.req.valid('param');
    const cartId = CartIdSchema.parse(id);
    const sessionId = SessionIdSchema.parse(cartId);
    const body = c.req.valid('json');
    const userId = c.var.userId;
    const order = await orderService.createOrder(sessionId, body, userId);
    // Convert API response to match OpenAPI schema
    // The backend returns status/type as strings matching enum values
    // Also convert taco sizes from string to TacoSize enum
    // Note: IDs for extras/drinks/desserts are plain strings from external API, but schema expects branded types
    const orderResponse = {
      ...order,
      OrderData: {
        ...order.OrderData,
        status: order.OrderData.status as OrderStatus,
        type: order.OrderData.type as OrderType,
        tacos: order.OrderData.tacos?.map((taco) => ({
          ...taco,
          size: taco.size as TacoSize,
        })),
        extras: order.OrderData.extras?.map((extra) => ({
          ...extra,
          id: ExtraIdSchema.parse(extra.id), // External API returns plain strings, parse to branded type
        })),
        boissons: order.OrderData.boissons?.map((drink) => ({
          ...drink,
          id: DrinkIdSchema.parse(drink.id), // External API returns plain strings, parse to branded type
        })),
        desserts: order.OrderData.desserts?.map((dessert) => ({
          ...dessert,
          id: DessertIdSchema.parse(dessert.id), // External API returns plain strings, parse to branded type
        })),
      },
    };
    return c.json(orderResponse, 201);
  }
);

export const cartRoutes = app;
