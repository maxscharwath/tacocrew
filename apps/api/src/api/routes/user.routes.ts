/**
 * User routes for Hono
 * @module api/routes/user
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import type { UserDeliveryProfile } from '../../schemas/user-delivery-profile.schema';
import { UserDeliveryProfileIdSchema } from '../../schemas/user-delivery-profile.schema';
import { UserService } from '../../services/user/user.service';
import { inject } from '../../shared/utils/inject.utils';
import { jsonContent, UserSchemas } from '../schemas/user.schemas';
import { authSecurity, createAuthenticatedRouteApp, requireUserId } from '../utils/route.utils';

const app = createAuthenticatedRouteApp();

const DeliveryProfileParamsSchema = z.object({
  profileId: z.uuid(),
});

const serializeDeliveryProfile = (profile: UserDeliveryProfile) => ({
  id: profile.id,
  label: profile.label ?? null,
  contactName: profile.contactName,
  phone: profile.phone,
  deliveryType: profile.deliveryType,
  address: {
    road: profile.address.road,
    houseNumber: profile.address.houseNumber ?? undefined,
    postcode: profile.address.postcode,
    city: profile.address.city,
    state: profile.address.state ?? undefined,
    country: profile.address.country ?? undefined,
  },
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});

app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me',
    tags: ['User'],
    security: authSecurity,
    responses: {
      200: {
        description: 'Authenticated user profile',
        content: jsonContent(UserSchemas.UserResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const userService = inject(UserService);

    // Check if userId is a valid UUID - if not, it's a Better Auth ID, look up by email from context
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(userId);

    let user;
    if (isValidUUID) {
      user = await userService.getUserById(userId);
    } else {
      // Better Auth ID - get email from context (set by auth middleware) or from Better Auth session
      const email = c.get('email') || c.req.header('x-user-email');
      if (email) {
        user = await userService.getUserByEmail(email);
      } else {
        // Fallback: try to get from Better Auth session
        const { auth } = await import('../../auth');
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });
        if (session?.user?.email) {
          user = await userService.getUserByEmail(session.user.email);
        } else {
          throw new Error('Unable to determine user email for Better Auth ID');
        }
      }
    }

    return c.json(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        slackId: user.slackId ?? undefined,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      },
      200
    );
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/orders',
    tags: ['User'],
    security: authSecurity,
    responses: {
      200: {
        description: "User's order history",
        content: jsonContent(UserSchemas.UserOrderHistoryEntrySchema.array()),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const orders = await inject(UserService).getUserOrderHistory(userId);
    return c.json(orders, 200);
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/group-orders',
    tags: ['User'],
    security: authSecurity,
    responses: {
      200: {
        description: 'Group orders where the user is leader',
        content: jsonContent(UserSchemas.UserGroupOrderSchema.array()),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const groupOrders = await inject(UserService).getUserGroupOrders(userId);
    return c.json(groupOrders, 200);
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/previous-orders',
    tags: ['User'],
    security: authSecurity,
    responses: {
      200: {
        description: 'Previous orders grouped by tacoID',
        content: jsonContent(UserSchemas.PreviousOrderSchema.array()),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const previousOrders = await inject(UserService).getPreviousOrders(userId);
    return c.json(
      previousOrders.map((order) => ({
        tacoID: order.tacoID,
        orderCount: order.orderCount,
        lastOrderedAt: order.lastOrderedAt.toISOString(),
        taco: order.taco,
        recentGroupOrderName: order.recentGroupOrderName ?? null,
      })),
      200
    );
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/delivery-profiles',
    tags: ['User'],
    security: authSecurity,
    responses: {
      200: {
        description: 'Saved delivery profiles',
        content: jsonContent(UserSchemas.DeliveryProfileSchema.array()),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const profiles = await inject(UserService).getDeliveryProfiles(userId);
    return c.json(profiles.map(serializeDeliveryProfile), 200);
  }
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/users/me/delivery-profiles',
    tags: ['User'],
    security: authSecurity,
    request: {
      body: {
        content: jsonContent(UserSchemas.DeliveryProfileRequestSchema),
      },
    },
    responses: {
      201: {
        description: 'Delivery profile saved',
        content: jsonContent(UserSchemas.DeliveryProfileSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const payload = c.req.valid('json');
    const profile = await inject(UserService).createDeliveryProfile(userId, payload);
    return c.json(serializeDeliveryProfile(profile), 201);
  }
);

app.openapi(
  createRoute({
    method: 'put',
    path: '/users/me/delivery-profiles/{profileId}',
    tags: ['User'],
    security: authSecurity,
    request: {
      params: DeliveryProfileParamsSchema,
      body: {
        content: jsonContent(UserSchemas.DeliveryProfileRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'Delivery profile updated',
        content: jsonContent(UserSchemas.DeliveryProfileSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { profileId: rawProfileId } = c.req.valid('param');
    const profileId = UserDeliveryProfileIdSchema.parse(rawProfileId);
    const payload = c.req.valid('json');
    const profile = await inject(UserService).updateDeliveryProfile(userId, profileId, payload);
    return c.json(serializeDeliveryProfile(profile), 200);
  }
);

app.openapi(
  createRoute({
    method: 'delete',
    path: '/users/me/delivery-profiles/{profileId}',
    tags: ['User'],
    security: authSecurity,
    request: {
      params: DeliveryProfileParamsSchema,
    },
    responses: {
      204: {
        description: 'Delivery profile deleted',
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { profileId: rawProfileId } = c.req.valid('param');
    const profileId = UserDeliveryProfileIdSchema.parse(rawProfileId);
    await inject(UserService).deleteDeliveryProfile(userId, profileId);
    return c.body(null, 204);
  }
);

export const userRoutes = app;
