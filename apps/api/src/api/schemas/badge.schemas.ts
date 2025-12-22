/**
 * Badge API schemas
 * @module api/schemas/badge
 *
 * Note: Badge definitions (name, description, image, tier, category) are in FE config.
 * These schemas only define user-specific API responses.
 */

import { z } from '@hono/zod-openapi';
import { ErrorResponseSchema, jsonContent } from './shared.schemas';

// Re-export shared utilities
export { jsonContent };

/**
 * Earned badge response - only includes badgeId, FE has definitions
 */
export const EarnedBadgeResponseSchema = z.object({
  badgeId: z.string(),
  earnedAt: z.string(),
  context: z
    .object({
      orderId: z.string().optional(),
      groupOrderId: z.string().optional(),
      value: z.number().optional(),
    })
    .nullable(),
});

/**
 * Badge progress response schema
 */
export const BadgeProgressResponseSchema = z.object({
  badgeId: z.string(),
  current: z.number(),
  target: z.number(),
  percentage: z.number(),
});

/**
 * Badge stats response schema (FE computes byTier/byCategory from its config)
 */
export const BadgeStatsResponseSchema = z.object({
  total: z.number(),
  earned: z.number(),
  earnedIds: z.array(z.string()),
});

/**
 * Badge schemas namespace
 */
export const BadgeSchemas = {
  EarnedBadgeResponseSchema,
  BadgeProgressResponseSchema,
  BadgeStatsResponseSchema,
  ErrorResponseSchema,
};
