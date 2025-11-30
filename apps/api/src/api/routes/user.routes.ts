/**
 * User routes for Hono
 * @module api/routes/user
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import type { User, UserId } from '../../schemas/user.schema';
import type { UserDeliveryProfile } from '../../schemas/user-delivery-profile.schema';
import { UserDeliveryProfileIdSchema } from '../../schemas/user-delivery-profile.schema';
import { UserService } from '../../services/user/user.service';
import {
  buildAvatarUrl,
  processAvatarImage,
  processProfileImage,
} from '../../shared/utils/image.utils';
import { logger } from '../../shared/utils/logger.utils';
import { inject } from '../../shared/utils/inject.utils';
import { jsonContent, UserSchemas } from '../schemas/user.schemas';
import { authSecurity, createAuthenticatedRouteApp, requireUserId } from '../utils/route.utils';

const app = createAuthenticatedRouteApp();

function serializeUserResponse(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    phone: user.phone ?? null,
    slackId: user.slackId ?? undefined,
    language: user.language ?? null,
    image: buildAvatarUrl(user),
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}

function buildErrorResponse(code: string, message: string) {
  return { error: { code, message } };
}

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

    return c.json(serializeUserResponse(user), 200);
  }
);

app.openapi(
  createRoute({
    method: 'patch',
    path: '/users/me/language',
    tags: ['User'],
    security: authSecurity,
    request: {
      body: {
        content: jsonContent(UserSchemas.UpdateUserLanguageRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'User language updated',
        content: jsonContent(UserSchemas.UserResponseSchema),
      },
      400: {
        description: 'Invalid language',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { language } = c.req.valid('json');
    const userService = inject(UserService);

    const updatedUser = await userService.updateUserLanguage(userId, language);

    return c.json(serializeUserResponse(updatedUser), 200);
  }
);

app.openapi(
  createRoute({
    method: 'patch',
    path: '/users/me/phone',
    tags: ['User'],
    security: authSecurity,
    request: {
      body: {
        content: jsonContent(UserSchemas.UpdateUserPhoneRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'User phone updated',
        content: jsonContent(UserSchemas.UserResponseSchema),
      },
      400: {
        description: 'Invalid phone',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { phone } = c.req.valid('json');
    const userService = inject(UserService);

    const updatedUser = await userService.updateUserPhone(userId, phone);

    return c.json(serializeUserResponse(updatedUser), 200);
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

app.openapi(
  createRoute({
    method: 'post',
    path: '/users/me/avatar',
    tags: ['User'],
    security: authSecurity,
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              image: z.any(),
              backgroundColor: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Avatar uploaded successfully',
        content: jsonContent(UserSchemas.UserResponseSchema),
      },
      400: {
        description: 'Invalid image file',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const formData = await c.req.formData();
    const file = formData.get('image');

    // Check if file exists and is a Blob-like object (File extends Blob)
    // In Node.js FormData, files are typically File objects which extend Blob
    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      logger.warn('Avatar upload: invalid file', {
        userId,
        fileType: typeof file,
        hasArrayBuffer: file && typeof file === 'object' ? 'arrayBuffer' in file : false,
      });
      return c.json(
        buildErrorResponse('USER_AVATAR_INVALID', 'Image file is required'),
        400
      );
    }

    try {
      // Extract optional background color
      const backgroundColor = formData.get('backgroundColor');
      const bgColor =
        backgroundColor && typeof backgroundColor === 'string' ? backgroundColor : undefined;

      // Process and compress the image with optional background color
      const processedImage = await processProfileImage(file as Blob, bgColor);

      // Update user image
      const userService = inject(UserService);
      const updatedUser = await userService.updateUserImage(userId, processedImage);

      return c.json(serializeUserResponse(updatedUser), 200);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';
      logger.error('Avatar upload failed', {
        error: errorMessage,
        userId,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return c.json(buildErrorResponse('USER_AVATAR_UPLOAD_FAILED', errorMessage), 400);
    }
  }
);

app.openapi(
  createRoute({
    method: 'delete',
    path: '/users/me/avatar',
    tags: ['User'],
    security: authSecurity,
    responses: {
      200: {
        description: 'Avatar deleted successfully',
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

    // Remove user image
    const updatedUser = await userService.updateUserImage(userId, null);

    return c.json(serializeUserResponse(updatedUser), 200);
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/users/{userId}/avatar',
    tags: ['User'],
    security: authSecurity,
    request: {
      params: z.object({
        userId: z.string(),
      }),
      query: z.object({
        w: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val, 10) : undefined)),
        h: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val, 10) : undefined)),
        size: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val, 10) : undefined)),
        dpr: z
          .string()
          .optional()
          .transform((val) => (val ? parseFloat(val) : undefined)),
        v: z.string().optional(), // Version parameter for cache busting (ignored but allowed)
      }),
    },
    responses: {
      200: {
        description: 'User avatar image',
        content: {
          'image/webp': {
            schema: z.instanceof(Buffer),
          },
        },
      },
      404: {
        description: 'Avatar not found',
        content: jsonContent(UserSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { userId } = c.req.valid('param');
    const { w, h, size, dpr } = c.req.valid('query');
    const userService = inject(UserService);

    try {
      const avatar = await userService.getUserAvatar(userId as UserId);

      if (!avatar) {
        logger.debug('Avatar not found for user', { userId });
        return c.json(buildErrorResponse('USER_AVATAR_NOT_FOUND', 'Avatar not found'), 404);
      }

      if (!avatar.image || avatar.image.length === 0) {
        logger.warn('Avatar image is empty for user', { userId });
        return c.json(buildErrorResponse('USER_AVATAR_NOT_FOUND', 'Avatar not found'), 404);
      }

      const { buffer: imageBuffer, etag } = await processAvatarImage(avatar.image, {
        width: w,
        height: h,
        size,
        dpr,
      });

      // Set common headers
      c.header('ETag', etag);
      if (avatar.updatedAt) {
        c.header('Last-Modified', avatar.updatedAt.toUTCString());
      }

      // Check for 304 Not Modified
      if (c.req.header('if-none-match') === etag) {
        return c.body(null, 304);
      }

      // Set response headers
      c.header('Cache-Control', 'public, max-age=31536000, immutable');
      c.header('Content-Type', 'image/webp');
      c.header('Content-Length', imageBuffer.length.toString());

      return c.body(new Uint8Array(imageBuffer), 200);
    } catch (error) {
      logger.error('Error serving avatar', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return c.json(buildErrorResponse('USER_AVATAR_NOT_FOUND', 'Avatar not found'), 404);
    }
  }
);

export const userRoutes = app;
