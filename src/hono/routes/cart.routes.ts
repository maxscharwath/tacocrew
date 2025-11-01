/**
 * Cart routes for Hono
 * @module hono/routes/cart
 */

import 'reflect-metadata';
import { Hono } from 'hono';
import { z } from 'zod';
import { schemas } from '../middleware/validation';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { UpdateTacoRequest } from '../../types';
import { inject } from '../../utils/inject';
import { zodValidator } from '../middleware/zod-validator';

// Helper type for validated request body from Zod schema
type RequestFor<T extends z.ZodTypeAny> = z.infer<T>;

const app = new Hono();

/**
 * Create new cart with session
 */
app.post('/carts', async (c) => {
  const cartService = inject(CartService);

  const { cartId } = await cartService.createCart({
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '',
    userAgent: c.req.header('user-agent') || '',
  });

  return c.json(
    {
      cartId,
    },
    201
  );
});

/**
 * Get cart contents with summary
 * Returns all cart items (tacos, extras, drinks, desserts) and totals
 */
app.get('/carts/:cartId', async (c) => {
  const cartId = c.req.param('cartId');
  const cartService = inject(CartService);
  const cart = await cartService.getCartWithSummary(cartId);

  return c.json(cart);
});

/**
 * Add taco to cart
 */
app.post('/carts/:cartId/tacos', zodValidator(schemas.addTaco), async (c) => {
  const cartId = c.req.param('cartId');
  const body: RequestFor<typeof schemas.addTaco> = c.get('validatedBody');
  const cartService = inject(CartService);
  const taco = await cartService.addTaco(cartId, body);

  return c.json(taco, 201);
});

/**
 * Get taco details
 */
app.get('/carts/:cartId/tacos/:id', async (c) => {
  const cartId = c.req.param('cartId');
  const id = c.req.param('id');
  const cartService = inject(CartService);
  const taco = await cartService.getTacoDetails(cartId, id);

  return c.json(taco);
});

/**
 * Update taco
 */
app.put('/carts/:cartId/tacos/:id', zodValidator(schemas.addTaco), async (c) => {
  const cartId = c.req.param('cartId');
  const id = c.req.param('id');
  const body: RequestFor<typeof schemas.addTaco> = c.get('validatedBody');
  const cartService = inject(CartService);

  const request: UpdateTacoRequest = { ...body, id };
  const taco = await cartService.updateTaco(cartId, request);

  return c.json(taco);
});

/**
 * Update taco quantity
 */
app.patch(
  '/carts/:cartId/tacos/:id/quantity',
  zodValidator(schemas.updateTacoQuantity),
  async (c) => {
    const cartId = c.req.param('cartId');
    const id = c.req.param('id');
    const body: RequestFor<typeof schemas.updateTacoQuantity> = c.get('validatedBody');
    const cartService = inject(CartService);
    const result = await cartService.updateTacoQuantity(cartId, id, body.action);

    return c.json(result);
  }
);

/**
 * Delete taco from cart
 */
app.delete('/carts/:cartId/tacos/:id', async (c) => {
  const cartId = c.req.param('cartId');
  const id = c.req.param('id');
  const cartService = inject(CartService);
  await cartService.deleteTaco(cartId, id);

  return c.body(null, 204);
});

/**
 * Add extra to cart
 */
app.post('/carts/:cartId/extras', zodValidator(schemas.addExtra), async (c) => {
  const cartId = c.req.param('cartId');
  const body: RequestFor<typeof schemas.addExtra> = c.get('validatedBody');
  const cartService = inject(CartService);
  const result = await cartService.addExtra(cartId, body);

  return c.json(result, 201);
});

/**
 * Add drink to cart
 */
app.post('/carts/:cartId/drinks', zodValidator(schemas.addDrink), async (c) => {
  const cartId = c.req.param('cartId');
  const body: RequestFor<typeof schemas.addDrink> = c.get('validatedBody');
  const cartService = inject(CartService);
  const result = await cartService.addDrink(cartId, body);

  return c.json(result, 201);
});

/**
 * Add dessert to cart
 */
app.post('/carts/:cartId/desserts', zodValidator(schemas.addDessert), async (c) => {
  const cartId = c.req.param('cartId');
  const body: RequestFor<typeof schemas.addDessert> = c.get('validatedBody');
  const cartService = inject(CartService);
  const result = await cartService.addDessert(cartId, body);

  return c.json(result, 201);
});

/**
 * Create order
 */
app.post('/carts/:cartId/orders', zodValidator(schemas.createOrder), async (c) => {
  const cartId = c.req.param('cartId');
  const body: RequestFor<typeof schemas.createOrder> = c.get('validatedBody');
  const orderService = inject(OrderService);
  const order = await orderService.createOrder(cartId, body);

  return c.json(order, 201);
});

export const cartRoutes = app;
