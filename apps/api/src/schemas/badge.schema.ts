/**
 * Badge domain schema (Zod)
 * @module schemas/badge
 */

import { z } from 'zod';
import { UserId } from '@/schemas/user.schema';
import type { Id } from '@/shared/utils/branded-ids.utils';

// ─────────────────────────────────────────────────────────────────────────────
// Branded Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Badge ID type - branded string (kebab-case)
 */
export type BadgeId = Id<'Badge'>;

/**
 * Parse a string to BadgeId
 */
export const BadgeId = z
  .string()
  .min(1)
  .transform((val) => val as BadgeId);

// ─────────────────────────────────────────────────────────────────────────────
// Badge Tiers & Categories
// ─────────────────────────────────────────────────────────────────────────────

export const BadgeTierSchema = z.enum(['bronze', 'silver', 'gold', 'platinum', 'legendary']);
export type BadgeTier = z.infer<typeof BadgeTierSchema>;

export const BadgeCategorySchema = z.enum([
  'ordering', // Related to placing orders
  'mystery', // Related to mystery tacos
  'social', // Related to groups & organizations
  'leadership', // Related to leading orders
  'exploration', // Related to trying new things
  'loyalty', // Related to consistent activity
  'special', // Limited time or secret badges
]);
export type BadgeCategory = z.infer<typeof BadgeCategorySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Trigger Types
// ─────────────────────────────────────────────────────────────────────────────

// Count-based trigger metrics
export const CountMetricSchema = z.enum([
  // Ordering
  'tacosOrdered',
  'mysteryTacosOrdered',
  'ordersPlaced',
  'totalSpentCentimes',
  // Leadership
  'groupOrdersCreated',
  'groupOrdersLed',
  // Social
  'organizationsJoined',
  'organizationsCreated',
  'membersInvited',
  'timesPaidForOthers',
  'timesGotReimbursed',
  // Exploration (computed from JSON arrays)
  'uniqueMeatsTried',
  'uniqueSaucesTried',
  'uniqueGarnituresTried',
]);
export type CountMetric = z.infer<typeof CountMetricSchema>;

export const CountTriggerSchema = z.object({
  type: z.literal('count'),
  metric: CountMetricSchema,
  threshold: z.number().int().positive(),
  operator: z.enum(['eq', 'gte', 'lte']).optional().default('gte'),
});
// Use z.input for the type that includes optional fields before defaults are applied
export type CountTrigger = z.input<typeof CountTriggerSchema>;

// Action-based triggers
export const ActionTriggerSchema = z.object({
  type: z.literal('action'),
  action: z.enum([
    'firstOrder',
    'firstMysteryTaco',
    'firstGroupOrderCreated',
    'firstGroupOrderLed',
    'joinedOrganization',
    'createdOrganization',
    'invitedMember',
    'paidForSomeoneElse',
    'gotReimbursed',
  ]),
});
export type ActionTrigger = z.infer<typeof ActionTriggerSchema>;

// Role-based triggers
export const RoleTriggerSchema = z.object({
  type: z.literal('role'),
  role: z.enum(['groupOrderLeader', 'organizationAdmin', 'organizationOwner']),
  minCount: z.number().int().positive().optional(),
});
export type RoleTrigger = z.infer<typeof RoleTriggerSchema>;

// Date-based triggers
export const DateConditionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('dayOfWeek'),
    day: z.number().int().min(0).max(6), // 0 = Sunday
  }),
  z.object({
    type: z.literal('specificDate'),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  }),
  z.object({
    type: z.literal('dayAndWeekday'),
    day: z.number().int().min(1).max(31),
    weekday: z.number().int().min(0).max(6), // 0 = Sunday, 5 = Friday
  }),
  z.object({
    type: z.literal('anniversary'),
    field: z.literal('accountCreated'),
  }),
  z.object({
    type: z.literal('range'),
    from: z.string(), // ISO date
    until: z.string(), // ISO date
  }),
  z.object({
    type: z.literal('registeredBefore'),
    date: z.string(), // ISO date - user must have registered on or before this date
  }),
]);
export type DateCondition = z.infer<typeof DateConditionSchema>;

export const DateTriggerSchema = z.object({
  type: z.literal('date'),
  condition: DateConditionSchema,
});
export type DateTrigger = z.infer<typeof DateTriggerSchema>;

// Time-based triggers
export const TimeConditionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('after'),
    hour: z.number().int().min(0).max(23),
  }),
  z.object({
    type: z.literal('before'),
    hour: z.number().int().min(0).max(23),
  }),
  z.object({
    type: z.literal('between'),
    fromHour: z.number().int().min(0).max(23),
    toHour: z.number().int().min(0).max(23),
  }),
]);
export type TimeCondition = z.infer<typeof TimeConditionSchema>;

export const TimeTriggerSchema = z.object({
  type: z.literal('time'),
  condition: TimeConditionSchema,
});
export type TimeTrigger = z.infer<typeof TimeTriggerSchema>;

// Streak-based triggers
export const StreakTriggerSchema = z.object({
  type: z.literal('streak'),
  activity: z.enum(['orderedInWeek', 'orderedInMonth', 'ledGroupOrder']),
  count: z.number().int().positive(),
});
export type StreakTrigger = z.infer<typeof StreakTriggerSchema>;

// Combo trigger (all conditions must be met)
export const ComboTriggerSchema: z.ZodType<ComboTrigger> = z.object({
  type: z.literal('combo'),
  conditions: z.lazy(() => BadgeTriggerSchema.array()),
});
export type ComboTrigger = {
  type: 'combo';
  conditions: BadgeTrigger[];
};

// Define BadgeTrigger type manually for proper input types (before defaults applied)
export type BadgeTrigger =
  | CountTrigger
  | ActionTrigger
  | RoleTrigger
  | DateTrigger
  | TimeTrigger
  | StreakTrigger
  | ComboTrigger;

// Union of all trigger types (for runtime validation)
export const BadgeTriggerSchema: z.ZodType<BadgeTrigger> = z.discriminatedUnion('type', [
  CountTriggerSchema,
  ActionTriggerSchema,
  RoleTriggerSchema,
  DateTriggerSchema,
  TimeTriggerSchema,
  StreakTriggerSchema,
  z.object({
    type: z.literal('combo'),
    conditions: z.lazy(() => BadgeTriggerSchema.array()),
  }),
]) as z.ZodType<BadgeTrigger>;

// ─────────────────────────────────────────────────────────────────────────────
// Badge Definition
// ─────────────────────────────────────────────────────────────────────────────

export const BadgeAvailabilitySchema = z.object({
  from: z.coerce.date().optional(),
  until: z.coerce.date().optional(),
});
export type BadgeAvailability = z.infer<typeof BadgeAvailabilitySchema>;

/**
 * Badge definition for BE evaluation only.
 * Display data (name, description, image, tier, category) is in FE config.
 */
export const BadgeDefinitionSchema = z.object({
  /** Unique identifier (kebab-case) - must match FE config */
  id: z.string().min(1),
  /** Trigger condition for earning the badge */
  trigger: BadgeTriggerSchema,
  /** Optional: only available during certain period */
  availability: BadgeAvailabilitySchema.optional(),
  /** Optional: hidden until earned (no progress shown) */
  secret: z.boolean().optional(),
});
export type BadgeDefinition = z.infer<typeof BadgeDefinitionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// User Badge (earned instance)
// ─────────────────────────────────────────────────────────────────────────────

export const UserBadgeContextSchema = z
  .object({
    orderId: z.string().optional(),
    groupOrderId: z.string().optional(),
    value: z.number().optional(),
  })
  .nullable();
export type UserBadgeContext = z.infer<typeof UserBadgeContextSchema>;

/**
 * Safely parse badge context from unknown (Prisma Json type)
 */
export function parseBadgeContext(raw: unknown): UserBadgeContext {
  if (raw === null || raw === undefined) return null;
  const result = UserBadgeContextSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export const UserBadgeSchema = z.object({
  id: z.string().uuid(),
  badgeId: z.string().min(1),
  userId: z.string().uuid(),
  earnedAt: z.coerce.date(),
  context: UserBadgeContextSchema.nullable(),
});
export type UserBadge = z.infer<typeof UserBadgeSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// User Stats
// ─────────────────────────────────────────────────────────────────────────────

export const UserStatsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  // Ordering
  tacosOrdered: z.number().int().nonnegative(),
  mysteryTacosOrdered: z.number().int().nonnegative(),
  ordersPlaced: z.number().int().nonnegative(),
  totalSpentCentimes: z.number().int().nonnegative(),
  // Leadership
  groupOrdersCreated: z.number().int().nonnegative(),
  groupOrdersLed: z.number().int().nonnegative(),
  // Social
  organizationsJoined: z.number().int().nonnegative(),
  organizationsCreated: z.number().int().nonnegative(),
  membersInvited: z.number().int().nonnegative(),
  timesPaidForOthers: z.number().int().nonnegative(),
  timesGotReimbursed: z.number().int().nonnegative(),
  // Exploration
  meatsTried: z.array(z.string()),
  saucesTried: z.array(z.string()),
  garnituresTried: z.array(z.string()),
  // Streaks
  currentOrderStreak: z.number().int().nonnegative(),
  longestOrderStreak: z.number().int().nonnegative(),
  lastOrderWeek: z.number().int().nullable(),
  lastOrderYear: z.number().int().nullable(),
});
export type UserStats = z.infer<typeof UserStatsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Badge Events (for evaluation)
// ─────────────────────────────────────────────────────────────────────────────

export const BadgeEventTypeSchema = z.enum([
  'orderCreated',
  'mysteryTacoOrdered',
  'groupOrderCreated',
  'groupOrderSubmitted',
  'organizationJoined',
  'organizationCreated',
  'memberInvited',
  'paidForOther',
  'gotReimbursed',
]);
export type BadgeEventType = z.infer<typeof BadgeEventTypeSchema>;

export const BadgeEventSchema = z.object({
  type: BadgeEventTypeSchema,
  userId: UserId,
  timestamp: z.coerce.date(),
  data: z.record(z.string(), z.unknown()).optional(),
});
export type BadgeEvent = z.infer<typeof BadgeEventSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────────────────

export const BadgeProgressSchema = z.object({
  badgeId: z.string().min(1),
  current: z.number(),
  target: z.number(),
  percentage: z.number().min(0).max(100),
});
export type BadgeProgress = z.infer<typeof BadgeProgressSchema>;

/**
 * API response for earned badge - only includes badgeId, FE has definitions
 */
export const EarnedBadgeResponseSchema = z.object({
  badgeId: z.string().min(1),
  earnedAt: z.coerce.date(),
  context: UserBadgeContextSchema.nullable(),
});
export type EarnedBadgeResponse = z.infer<typeof EarnedBadgeResponseSchema>;
