/**
 * Badge routes for Hono
 * @module api/routes/badge
 *
 * Note: Badge definitions are now in FE config with Vite-optimized images.
 * These endpoints only return user-specific data.
 */

import { createRoute } from '@hono/zod-openapi';
import { BadgeSchemas, jsonContent } from '@/api/schemas/badge.schemas';
import { authSecurity, createAuthenticatedRouteApp } from '@/api/utils/route.utils';
import { BadgeService } from '@/services/badge/badge.service';
import { inject } from '@/shared/utils/inject.utils';

const app = createAuthenticatedRouteApp();

/**
 * Get current user's earned badges (just IDs, FE has definitions)
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/badges',
    tags: ['Badges'],
    security: authSecurity,
    responses: {
      200: {
        description: "User's earned badge IDs with timestamps",
        content: jsonContent(BadgeSchemas.EarnedBadgeResponseSchema.array()),
      },
    },
  }),
  async (c) => {
    const userId = c.var.user.id;
    const badgeService = inject(BadgeService);
    const badges = await badgeService.getUserBadges(userId);

    return c.json(
      badges.map((b) => ({
        badgeId: b.badgeId,
        earnedAt: b.earnedAt.toISOString(),
        context: b.context,
      })),
      200
    );
  }
);

/**
 * Get current user's badge statistics
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/badges/stats',
    tags: ['Badges'],
    security: authSecurity,
    responses: {
      200: {
        description: "User's badge statistics",
        content: jsonContent(BadgeSchemas.BadgeStatsResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = c.var.user.id;
    const badgeService = inject(BadgeService);
    const stats = await badgeService.getUserBadgeStats(userId);
    return c.json(stats, 200);
  }
);

/**
 * Get current user's badge progress
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/badges/progress',
    tags: ['Badges'],
    security: authSecurity,
    responses: {
      200: {
        description: "User's progress toward unearned badges",
        content: jsonContent(BadgeSchemas.BadgeProgressResponseSchema.array()),
      },
    },
  }),
  async (c) => {
    const userId = c.var.user.id;
    const badgeService = inject(BadgeService);
    const progress = await badgeService.getUserBadgeProgress(userId);
    return c.json(progress, 200);
  }
);

export const badgeRoutes = app;
