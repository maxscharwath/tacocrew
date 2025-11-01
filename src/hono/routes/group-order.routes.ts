/**
 * Group order routes for Hono
 * @module hono/routes/group-order
 */

import 'reflect-metadata';
import { Hono } from 'hono';
import { z } from 'zod';
import { GroupOrderService } from '../../services/group-order.service';
import { UserOrderService } from '../../services/user-order.service';
import { inject } from '../../utils/inject';
import { zodValidator } from '../middleware/zod-validator';
import { usernameHeader } from '../middleware/username-header';
import { schemas } from '../middleware/validation';

// Helper type for validated request body from Zod schema
type RequestFor<T extends z.ZodTypeAny> = z.infer<T>;

const app = new Hono();

// Validation schemas
const groupOrderSchemas = {
  createGroupOrder: z.object({
    name: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  updateGroupOrder: z.object({
    name: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
  updateUserOrder: z.object({
    items: z.object({
      tacos: z.array(z.any()), // Taco validation is complex, handled in service
      extras: z.array(z.any()),
      drinks: z.array(z.any()),
      desserts: z.array(z.any()),
    }),
  }),
  submitGroupOrder: schemas.createOrder,
};

// Apply username header middleware to all routes
app.use('*', usernameHeader);

/**
 * Create new group order
 */
app.post('/', zodValidator(groupOrderSchemas.createGroupOrder), async (c) => {
  const username = c.get('username');
  const body: RequestFor<typeof groupOrderSchemas.createGroupOrder> = c.get('validatedBody');
  const groupOrderService = inject(GroupOrderService);

  const groupOrder = await groupOrderService.createGroupOrder(username, body);

  return c.json(groupOrder, 201);
});

/**
 * Get group order by ID
 */
app.get('/:groupOrderId', async (c) => {
  const groupOrderId = c.req.param('groupOrderId');
  const groupOrderService = inject(GroupOrderService);

  const groupOrder = await groupOrderService.getGroupOrder(groupOrderId);

  return c.json(groupOrder);
});

/**
 * Get group order with all user orders
 */
app.get('/:groupOrderId/details', async (c) => {
  const groupOrderId = c.req.param('groupOrderId');
  const groupOrderService = inject(GroupOrderService);

  const groupOrder = await groupOrderService.getGroupOrderWithUserOrders(groupOrderId);

  return c.json(groupOrder);
});

/**
 * Update group order (leader only)
 */
app.put(
  '/:groupOrderId',
  zodValidator(groupOrderSchemas.updateGroupOrder),
  async (c) => {
    const groupOrderId = c.req.param('groupOrderId');
    const username = c.get('username');
    const body: RequestFor<typeof groupOrderSchemas.updateGroupOrder> = c.get('validatedBody');
    const groupOrderService = inject(GroupOrderService);

    const groupOrder = await groupOrderService.updateGroupOrder(groupOrderId, username, body);

    return c.json(groupOrder);
  }
);

/**
 * Mark group order as submitted (leader only)
 * This marks it ready for final submission to backend
 */
app.post('/:groupOrderId/submit', async (c) => {
  const groupOrderId = c.req.param('groupOrderId');
  const username = c.get('username');
  const groupOrderService = inject(GroupOrderService);

  const groupOrder = await groupOrderService.submitGroupOrder(groupOrderId, username);

  return c.json(groupOrder);
});

/**
 * Submit group order to backend (leader only)
 * This creates the real cart and order
 */
app.post(
  '/:groupOrderId/submit-to-backend',
  zodValidator(groupOrderSchemas.submitGroupOrder),
  async (c) => {
    const groupOrderId = c.req.param('groupOrderId');
    const username = c.get('username');
    const body: RequestFor<typeof groupOrderSchemas.submitGroupOrder> = c.get('validatedBody');
    const groupOrderService = inject(GroupOrderService);

    const result = await groupOrderService.submitGroupOrderToBackend(
      groupOrderId,
      username,
      body
    );

    return c.json(result, 201);
  }
);

/**
 * Get user's order in a group order
 */
app.get('/:groupOrderId/orders/my', async (c) => {
  const groupOrderId = c.req.param('groupOrderId');
  const username = c.get('username');
  const userOrderService = inject(UserOrderService);

  const userOrder = await userOrderService.getUserOrder(groupOrderId, username);

  return c.json(userOrder);
});

/**
 * Create or update user order
 */
app.put(
  '/:groupOrderId/orders/my',
  zodValidator(groupOrderSchemas.updateUserOrder),
  async (c) => {
    const groupOrderId = c.req.param('groupOrderId');
    const username = c.get('username');
    const body: RequestFor<typeof groupOrderSchemas.updateUserOrder> = c.get('validatedBody');
    const userOrderService = inject(UserOrderService);

    const userOrder = await userOrderService.upsertUserOrder(groupOrderId, username, body);

    return c.json(userOrder);
  }
);

/**
 * Submit user's order (mark as submitted)
 */
app.post('/:groupOrderId/orders/my/submit', async (c) => {
  const groupOrderId = c.req.param('groupOrderId');
  const username = c.get('username');
  const userOrderService = inject(UserOrderService);

  const userOrder = await userOrderService.submitUserOrder(groupOrderId, username);

  return c.json(userOrder);
});

/**
 * Delete user's own order
 */
app.delete('/:groupOrderId/orders/my', async (c) => {
  const groupOrderId = c.req.param('groupOrderId');
  const username = c.get('username');
  const userOrderService = inject(UserOrderService);

  await userOrderService.deleteUserOrder(groupOrderId, username, username);

  return c.body(null, 204);
});

/**
 * Get all user orders in a group order
 */
app.get('/:groupOrderId/orders', async (c) => {
  const groupOrderId = c.req.param('groupOrderId');
  const userOrderService = inject(UserOrderService);

  const userOrders = await userOrderService.getUserOrdersByGroup(groupOrderId);

  return c.json(userOrders);
});

/**
 * Delete a user order (leader only)
 */
app.delete('/:groupOrderId/orders/:username', async (c) => {
  const groupOrderId = c.req.param('groupOrderId');
  const targetUsername = c.req.param('username');
  const deleterUsername = c.get('username');
  const userOrderService = inject(UserOrderService);

  await userOrderService.deleteUserOrder(groupOrderId, targetUsername, deleterUsername);

  return c.body(null, 204);
});

export const groupOrderRoutes = app;
