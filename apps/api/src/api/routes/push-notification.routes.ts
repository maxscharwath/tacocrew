/**
 * Push notification routes
 * @module api/routes/push-notification
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { PushSubscriptionRepository } from '../../infrastructure/repositories/push-subscription.repository';
import { t } from '../../lib/i18n';
import { NotificationService } from '../../services/notification/notification.service';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';
import { jsonContent } from '../schemas/shared.schemas';
import { authSecurity, createAuthenticatedRouteApp, requireUserId } from '../utils/route.utils';

const app = createAuthenticatedRouteApp();

const PushSubscriptionRequestSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});

app.openapi(
  createRoute({
    method: 'post',
    path: '/push/subscribe',
    tags: ['Push Notifications'],
    security: authSecurity,
    request: {
      body: {
        content: jsonContent(PushSubscriptionRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'Push subscription created',
        content: jsonContent(
          z.object({
            success: z.boolean(),
          })
        ),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const body = c.req.valid('json');
    const pushSubscriptionRepository = inject(PushSubscriptionRepository);

    await pushSubscriptionRepository.create(userId, {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent || c.req.header('user-agent') || undefined,
    });

    return c.json({ success: true }, 200);
  }
);

app.openapi(
  createRoute({
    method: 'delete',
    path: '/push/unsubscribe',
    tags: ['Push Notifications'],
    security: authSecurity,
    request: {
      body: {
        content: jsonContent(
          z.object({
            endpoint: z.string().url(),
          })
        ),
      },
    },
    responses: {
      200: {
        description: 'Push subscription removed',
        content: jsonContent(
          z.object({
            success: z.boolean(),
          })
        ),
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');
    const pushSubscriptionRepository = inject(PushSubscriptionRepository);

    await pushSubscriptionRepository.delete(body.endpoint);

    return c.json({ success: true }, 200);
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/push/public-key',
    tags: ['Push Notifications'],
    security: authSecurity,
    responses: {
      200: {
        description: 'VAPID public key',
        content: jsonContent(
          z.object({
            publicKey: z.string(),
          })
        ),
      },
    },
  }),
  (c) => {
    const notificationService = inject(NotificationService);
    const publicKey = notificationService.getVapidPublicKey();

    return c.json({ publicKey }, 200);
  }
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/push/subscriptions',
    tags: ['Push Notifications'],
    security: authSecurity,
    responses: {
      200: {
        description: 'List of push subscriptions',
        content: jsonContent(
          z.array(
            z.object({
              id: z.string(),
              endpoint: z.string(),
              userAgent: z.string().nullable(),
              createdAt: z.string(),
              updatedAt: z.string(),
            })
          )
        ),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const pushSubscriptionRepository = inject(PushSubscriptionRepository);

    const subscriptions = await pushSubscriptionRepository.findAllByUserId(userId);

    return c.json(
      subscriptions.map((sub) => ({
        id: sub.id,
        endpoint: sub.endpoint,
        userAgent: sub.userAgent,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
      })),
      200
    );
  }
);

app.openapi(
  createRoute({
    method: 'delete',
    path: '/push/subscriptions/{id}',
    tags: ['Push Notifications'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'Push subscription removed',
        content: jsonContent(
          z.object({
            success: z.boolean(),
          })
        ),
      },
      404: {
        description: 'Subscription not found',
        content: jsonContent(
          z.object({
            error: z.string(),
          })
        ),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id } = c.req.valid('param');
    const pushSubscriptionRepository = inject(PushSubscriptionRepository);

    // Verify the subscription belongs to the user
    const subscriptions = await pushSubscriptionRepository.findAllByUserId(userId);
    const subscription = subscriptions.find((sub) => sub.id === id);

    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    await pushSubscriptionRepository.delete(subscription.endpoint);

    return c.json({ success: true }, 200);
  }
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/push/test',
    tags: ['Push Notifications'],
    security: authSecurity,
    responses: {
      200: {
        description: 'Test notification sent',
        content: jsonContent(
          z.object({
            success: z.boolean(),
            message: z.string(),
          })
        ),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const notificationService = inject(NotificationService);

    logger.debug('Sending test notification', { userId });

    await notificationService.sendToUser(
      userId,
      {
        type: 'test',
        title: t('notifications.test.title'),
        body: t('notifications.test.body'),
        tag: 'test-notification',
        icon: '/icon.png',
        data: {
          timestamp: new Date().toISOString(),
        },
      },
      { skipPersist: true } // Don't store test notifications in DB
    );

    return c.json(
      {
        success: true,
        message: 'Test notification sent successfully',
      },
      200
    );
  }
);

export default app;
