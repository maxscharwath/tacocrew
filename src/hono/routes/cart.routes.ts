/**
 * Cart routes for Hono
 * @module hono/routes/cart
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { SessionIdSchema } from '@/domain/schemas/session.schema';
import { optionalAuthMiddleware } from '@/hono/middleware/auth';
import { CartSchemas, CartSecurity, jsonContent } from '@/hono/routes/cart.schemas';
import { DessertSchema, DrinkSchema, ExtraSchema, TacoSchema } from '@/hono/routes/shared.schemas';
import { CartService } from '@/services/cart.service';
import { OrderService } from '@/services/order.service';
import { UpdateTacoRequest } from '@/types';
import { inject } from '@/utils/inject';

const app = new OpenAPIHono();

// Optional auth for cart routes (to link orders to users when authenticated)
app.use('*', optionalAuthMiddleware);

const routeDefinitions = [
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id } = await cartService.createCart({
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '',
        userAgent: c.req.header('user-agent') || '',
      });
      return c.json({ id }, 201);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id } = c.req.valid('param');
      const cart = await cartService.getCartWithSummary(id);
      return c.json(cart);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const taco = await cartService.addTaco(id, body);
      return c.json(taco, 201);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id, itemId } = c.req.valid('param');
      const taco = await cartService.getTacoDetails(id, itemId);
      return c.json(taco);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id, itemId } = c.req.valid('param');
      const body = c.req.valid('json');
      const request = { ...body, id: itemId } as UpdateTacoRequest;
      const taco = await cartService.updateTaco(id, request);
      return c.json(taco);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id, itemId } = c.req.valid('param');
      const { action } = c.req.valid('json');
      const result = await cartService.updateTacoQuantity(id, itemId, action);
      return c.json(result);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id, itemId } = c.req.valid('param');
      await cartService.deleteTaco(id, itemId);
      return c.body(null, 204);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await cartService.addExtra(id, body);
      return c.json(result, 201);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await cartService.addDrink(id, body);
      return c.json(result, 201);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const cartService = inject(CartService);
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await cartService.addDessert(id, body);
      return c.json(result, 201);
    },
  },
  {
    route: createRoute({
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
    handler: async (c) => {
      const orderService = inject(OrderService);
      const { id } = c.req.valid('param');
      const sessionId = SessionIdSchema.parse(id);
      const body = c.req.valid('json');
      const userId = c.var.userId;
      const order = await orderService.createOrder(sessionId, body, userId);
      return c.json(order, 201);
    },
  },
];

routeDefinitions.forEach(({ route, handler }) => {
  app.openapi(route, handler);
});

export const cartRoutes = app;
