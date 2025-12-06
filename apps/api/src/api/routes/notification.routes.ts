/**
 * Notification routes
 * @module api/routes/notification
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { NotificationRepository } from '@/infrastructure/repositories/notification.repository';
import { inject } from '@/shared/utils/inject.utils';
import {
  CursorPaginationQuerySchema,
  createPageSchema,
  jsonContent,
} from '@/api/schemas/shared.schemas';
import { authSecurity, createAuthenticatedRouteApp, requireUserId } from '@/api/utils/route.utils';

const app = createAuthenticatedRouteApp();

const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  url: z.string().nullable(),
  data: z.record(z.string(), z.unknown()).nullable(),
  read: z.boolean(),
  readAt: z.string().nullable(),
  archived: z.boolean(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
});

const NotificationPageSchema = createPageSchema(NotificationSchema);

// Shared response schemas to reduce duplication
const ErrorResponseSchema = z.object({ error: z.string() });
const SuccessCountResponseSchema = z.object({ success: z.boolean(), count: z.number() });
const NotificationIdParamSchema = z.object({ id: z.string() });

/** Transform NotificationRecord to JSON response */
function toNotificationJson(n: {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  readAt: Date | null;
  archived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    url: n.url,
    data: n.data,
    read: n.read,
    readAt: n.readAt?.toISOString() || null,
    archived: n.archived,
    archivedAt: n.archivedAt?.toISOString() || null,
    createdAt: n.createdAt.toISOString(),
  };
}

// GET /notifications - List user's notifications with cursor-based pagination
app.openapi(
  createRoute({
    method: 'get',
    path: '/notifications',
    tags: ['Notifications'],
    security: authSecurity,
    request: {
      query: CursorPaginationQuerySchema.extend({
        archived: z
          .string()
          .optional()
          .transform((v) => v === 'true'),
      }),
    },
    responses: {
      200: {
        description: 'Paginated list of notifications',
        content: jsonContent(NotificationPageSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { limit, cursor, archived } = c.req.valid('query');
    const notificationRepository = inject(NotificationRepository);

    const result = await notificationRepository.findByUserId(userId, { limit, cursor, archived });

    return c.json(
      {
        items: result.items.map(toNotificationJson),
        total: result.total,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
      200
    );
  }
);

// GET /notifications/unread-count - Get unread count for bell badge
app.openapi(
  createRoute({
    method: 'get',
    path: '/notifications/unread-count',
    tags: ['Notifications'],
    security: authSecurity,
    responses: {
      200: {
        description: 'Unread notification count',
        content: jsonContent(
          z.object({
            count: z.number(),
          })
        ),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const notificationRepository = inject(NotificationRepository);

    const count = await notificationRepository.getUnreadCount(userId);

    return c.json({ count }, 200);
  }
);

// PATCH /notifications/:id/read - Mark as read
app.openapi(
  createRoute({
    method: 'patch',
    path: '/notifications/{id}/read',
    tags: ['Notifications'],
    security: authSecurity,
    request: {
      params: NotificationIdParamSchema,
    },
    responses: {
      200: {
        description: 'Notification marked as read',
        content: jsonContent(NotificationSchema),
      },
      404: {
        description: 'Notification not found',
        content: jsonContent(ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id } = c.req.valid('param');
    const notificationRepository = inject(NotificationRepository);

    const notification = await notificationRepository.markAsRead(id, userId);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json(toNotificationJson(notification), 200);
  }
);

// POST /notifications/mark-all-read - Mark all as read
app.openapi(
  createRoute({
    method: 'post',
    path: '/notifications/mark-all-read',
    tags: ['Notifications'],
    security: authSecurity,
    responses: {
      200: {
        description: 'All notifications marked as read',
        content: jsonContent(SuccessCountResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const notificationRepository = inject(NotificationRepository);

    const count = await notificationRepository.markAllAsRead(userId);

    return c.json({ success: true, count }, 200);
  }
);

// PATCH /notifications/:id/archive - Archive a notification
app.openapi(
  createRoute({
    method: 'patch',
    path: '/notifications/{id}/archive',
    tags: ['Notifications'],
    security: authSecurity,
    request: {
      params: NotificationIdParamSchema,
    },
    responses: {
      200: {
        description: 'Notification archived',
        content: jsonContent(NotificationSchema),
      },
      404: {
        description: 'Notification not found',
        content: jsonContent(ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id } = c.req.valid('param');
    const notificationRepository = inject(NotificationRepository);

    const notification = await notificationRepository.archive(id, userId);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json(toNotificationJson(notification), 200);
  }
);

// POST /notifications/archive-all - Archive all notifications
app.openapi(
  createRoute({
    method: 'post',
    path: '/notifications/archive-all',
    tags: ['Notifications'],
    security: authSecurity,
    responses: {
      200: {
        description: 'All notifications archived',
        content: jsonContent(SuccessCountResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const notificationRepository = inject(NotificationRepository);

    const count = await notificationRepository.archiveAll(userId);

    return c.json({ success: true, count }, 200);
  }
);

export const notificationRoutes = app;
