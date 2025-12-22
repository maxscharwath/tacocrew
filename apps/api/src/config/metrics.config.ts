/**
 * Metrics Registry - Single source of truth for all badge metrics
 *
 * To add a new metric:
 * 1. Add field to UserStats in Prisma schema
 * 2. Add entry here with accessor
 * 3. Update stats in the relevant service when event occurs
 *
 * That's it! No other code changes needed.
 */

import type { UserStats } from '@/generated/client';
import type { BadgeEventType } from '@/schemas/badge.schema';

export interface MetricDefinition {
  /** Unique metric identifier (matches CountMetric type) */
  readonly id: string;
  /** How to get the value from UserStats */
  readonly getValue: (stats: UserStats) => number;
  /** Which events can change this metric */
  readonly updatedBy: readonly BadgeEventType[];
}

/**
 * All available metrics for badge triggers
 * Adding a new metric here automatically makes it available in badge triggers
 */
export const METRICS: readonly MetricDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Ordering Metrics
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'tacosOrdered',
    getValue: (s) => s.tacosOrdered,
    updatedBy: ['orderCreated'],
  },
  {
    id: 'mysteryTacosOrdered',
    getValue: (s) => s.mysteryTacosOrdered,
    updatedBy: ['mysteryTacoOrdered', 'orderCreated'],
  },
  {
    id: 'ordersPlaced',
    getValue: (s) => s.ordersPlaced,
    updatedBy: ['orderCreated'],
  },
  {
    id: 'totalSpentCentimes',
    getValue: (s) => s.totalSpentCentimes,
    updatedBy: ['orderCreated'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leadership Metrics
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'groupOrdersCreated',
    getValue: (s) => s.groupOrdersCreated,
    updatedBy: ['groupOrderCreated'],
  },
  {
    id: 'groupOrdersLed',
    getValue: (s) => s.groupOrdersLed,
    updatedBy: ['groupOrderSubmitted'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Social Metrics
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'organizationsJoined',
    getValue: (s) => s.organizationsJoined,
    updatedBy: ['organizationJoined'],
  },
  {
    id: 'organizationsCreated',
    getValue: (s) => s.organizationsCreated,
    updatedBy: ['organizationCreated'],
  },
  {
    id: 'membersInvited',
    getValue: (s) => s.membersInvited,
    updatedBy: ['memberInvited'],
  },
  {
    id: 'timesPaidForOthers',
    getValue: (s) => s.timesPaidForOthers,
    updatedBy: ['paidForOther'],
  },
  {
    id: 'timesGotReimbursed',
    getValue: (s) => s.timesGotReimbursed,
    updatedBy: ['gotReimbursed'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Exploration Metrics (computed from JSON arrays)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'uniqueMeatsTried',
    getValue: (s) => (Array.isArray(s.meatsTried) ? s.meatsTried.length : 0),
    updatedBy: ['orderCreated'],
  },
  {
    id: 'uniqueSaucesTried',
    getValue: (s) => (Array.isArray(s.saucesTried) ? s.saucesTried.length : 0),
    updatedBy: ['orderCreated'],
  },
  {
    id: 'uniqueGarnituresTried',
    getValue: (s) => (Array.isArray(s.garnituresTried) ? s.garnituresTried.length : 0),
    updatedBy: ['orderCreated'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Streak Metrics
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'currentOrderStreak',
    getValue: (s) => s.currentOrderStreak,
    updatedBy: ['orderCreated'],
  },
  {
    id: 'longestOrderStreak',
    getValue: (s) => s.longestOrderStreak,
    updatedBy: ['orderCreated'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions (auto-generated from config)
// ─────────────────────────────────────────────────────────────────────────────

/** Map of metric ID to definition for O(1) lookup */
const metricsById = new Map(METRICS.map((m) => [m.id, m]));

/** Get metric value from stats */
export function getMetricValue(metricId: string, stats: UserStats): number {
  const metric = metricsById.get(metricId);
  return metric ? metric.getValue(stats) : 0;
}

/** Get all metrics that can be affected by an event */
export function getMetricsForEvent(eventType: BadgeEventType): readonly MetricDefinition[] {
  return METRICS.filter((m) => m.updatedBy.includes(eventType));
}

/** Get all event types that can affect a metric */
export function getEventsForMetric(metricId: string): readonly BadgeEventType[] {
  return metricsById.get(metricId)?.updatedBy ?? [];
}

/** Check if a metric exists */
export function hasMetric(metricId: string): boolean {
  return metricsById.has(metricId);
}
