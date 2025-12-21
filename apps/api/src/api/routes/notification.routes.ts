/**
 * Notification routes
 * @module api/routes/notification
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  CursorPaginationQuerySchema,
  createPageSchema,
  jsonContent,
} from '@/api/schemas/shared.schemas';
import { authSecurity, createAuthenticatedRouteApp } from '@/api/utils/route.utils';
import type { Notification } from '@/generated/client';
import { NotificationRepository } from '@/infrastructure/repositories/notification.repository';
import { inject } from '@/shared/utils/inject.utils';

const app = createAuthenticatedRouteApp();

const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  url: z.string().nullable(),
  data: z.record(z.string(), z.unknown()).nullable(),
  read: z.boolean(),
  readAt: z.preprocess(
    (val) => (val instanceof Date ? val.toISOString() : val),
    z.coerce.string().nullable()
  ),
  archived: z.boolean(),
  archivedAt: z.preprocess(
    (val) => (val instanceof Date ? val.toISOString() : val),
    z.coerce.string().nullable()
  ),
  createdAt: z.preprocess(
    (val) => (val instanceof Date ? val.toISOString() : val),
    z.coerce.string()
  ),
});

const NotificationPageSchema = createPageSchema(NotificationSchema);

// Shared response schemas to reduce duplication
const ErrorResponseSchema = z.object({ error: z.string() });
const SuccessCountResponseSchema = z.object({ success: z.boolean(), count: z.number() });
const NotificationIdParamSchema = z.object({ id: z.string() });

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
        before: z.string().optional().describe('Cursor for the previous page'),
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
    const userId = c.var.user.id;
    const { limit, cursor, before, archived } = c.req.valid('query');
    const notificationRepository = inject(NotificationRepository);

    const result = await notificationRepository.findByUserId(userId, {
      limit,
      cursor,
      before,
      archived,
    });

    // Use Spring Boot-style map() to transform the page
    const response = result.map(function (n: Notification) {
      return NotificationSchema.parse(n);
    });

    // Convert to JSON format expected by frontend
    const jsonResponse = response.toJSON();
    return c.json(
      {
        ...jsonResponse,
        hasMore: jsonResponse.hasNextPage,
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
    const userId = c.var.user.id;
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
    const userId = c.var.user.id;
    const { id } = c.req.valid('param');
    const notificationRepository = inject(NotificationRepository);

    const notification = await notificationRepository.markAsRead(id, userId);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json(NotificationSchema.parse(notification), 200);
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
    const userId = c.var.user.id;
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
    const userId = c.var.user.id;
    const { id } = c.req.valid('param');
    const notificationRepository = inject(NotificationRepository);

    const notification = await notificationRepository.archive(id, userId);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json(NotificationSchema.parse(notification), 200);
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
    const userId = c.var.user.id;
    const notificationRepository = inject(NotificationRepository);

    const count = await notificationRepository.archiveAll(userId);

    return c.json({ success: true, count }, 200);
  }
);

export const notificationRoutes = app;
