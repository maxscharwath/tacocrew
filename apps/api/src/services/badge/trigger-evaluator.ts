/**
 * Badge trigger evaluators - Simplified config-driven evaluation
 * @module services/badge/trigger-evaluator
 *
 * This module evaluates badge triggers against user stats and events.
 * All metrics are defined in metrics.config.ts - no switch statements needed here.
 */

import type { UserStats } from '@/generated/client';
import { getMetricValue } from '@/config/metrics.config';
import type {
  ActionTrigger,
  BadgeEvent,
  BadgeEventType,
  BadgeTrigger,
  ComboTrigger,
  CountTrigger,
  DateTrigger,
  RoleTrigger,
  StreakTrigger,
  TimeTrigger,
} from '@/schemas/badge.schema';

export interface EvaluationContext {
  readonly stats: UserStats;
  readonly event: BadgeEvent;
  readonly userCreatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Registry - Maps actions to their triggering events
// To add a new action: just add it here and in the schema
// ─────────────────────────────────────────────────────────────────────────────

interface ActionConfig {
  /** Event type that triggers this action */
  readonly event: BadgeEventType;
  /** Optional: metric that must be exactly 1 (for "first X" actions) */
  readonly requiresFirst?: string;
}

const ACTION_REGISTRY: Record<string, ActionConfig> = {
  firstOrder: { event: 'orderCreated', requiresFirst: 'ordersPlaced' },
  firstMysteryTaco: { event: 'mysteryTacoOrdered', requiresFirst: 'mysteryTacosOrdered' },
  firstGroupOrderCreated: { event: 'groupOrderCreated', requiresFirst: 'groupOrdersCreated' },
  firstGroupOrderLed: { event: 'groupOrderSubmitted', requiresFirst: 'groupOrdersLed' },
  joinedOrganization: { event: 'organizationJoined' },
  createdOrganization: { event: 'organizationCreated' },
  invitedMember: { event: 'memberInvited' },
  paidForSomeoneElse: { event: 'paidForOther' },
  gotReimbursed: { event: 'gotReimbursed' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Evaluator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate a badge trigger against user stats and event
 */
export function evaluateTrigger(trigger: BadgeTrigger, context: EvaluationContext): boolean {
  switch (trigger.type) {
    case 'count':
      return evaluateCountTrigger(trigger, context);
    case 'action':
      return evaluateActionTrigger(trigger, context);
    case 'role':
      return evaluateRoleTrigger(trigger, context);
    case 'date':
      return evaluateDateTrigger(trigger, context);
    case 'time':
      return evaluateTimeTrigger(trigger, context);
    case 'streak':
      return evaluateStreakTrigger(trigger, context);
    case 'combo':
      return evaluateComboTrigger(trigger, context);
    default:
      return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Trigger Evaluators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count-based trigger: check if a metric meets the threshold
 * Uses metrics.config.ts for value lookup - no switch statement needed!
 */
function evaluateCountTrigger(trigger: CountTrigger, context: EvaluationContext): boolean {
  const value = getMetricValue(trigger.metric, context.stats);
  const operator = trigger.operator ?? 'gte';

  switch (operator) {
    case 'eq':
      return value === trigger.threshold;
    case 'gte':
      return value >= trigger.threshold;
    case 'lte':
      return value <= trigger.threshold;
    default:
      return false;
  }
}

/**
 * Action-based trigger: check if a specific action just happened
 * Uses ACTION_REGISTRY for lookup - no switch statement needed!
 */
function evaluateActionTrigger(trigger: ActionTrigger, context: EvaluationContext): boolean {
  const config = ACTION_REGISTRY[trigger.action];
  if (!config) return false;

  // Check if this event matches the action's event
  if (context.event.type !== config.event) return false;

  // If it's a "first X" action, check the metric is exactly 1
  if (config.requiresFirst) {
    const value = getMetricValue(config.requiresFirst, context.stats);
    return value === 1;
  }

  return true;
}

/**
 * Role-based trigger: check if user has a specific role
 */
function evaluateRoleTrigger(trigger: RoleTrigger, context: EvaluationContext): boolean {
  const minCount = trigger.minCount ?? 1;

  switch (trigger.role) {
    case 'groupOrderLeader':
      return getMetricValue('groupOrdersLed', context.stats) >= minCount;
    case 'organizationAdmin':
    case 'organizationOwner':
      return getMetricValue('organizationsCreated', context.stats) >= minCount;
    default:
      return false;
  }
}

/**
 * Date-based trigger: check if the event happened on a special date
 */
function evaluateDateTrigger(trigger: DateTrigger, context: EvaluationContext): boolean {
  const date = context.event.timestamp;
  const condition = trigger.condition;

  switch (condition.type) {
    case 'dayOfWeek':
      return date.getDay() === condition.day;

    case 'specificDate':
      return date.getMonth() + 1 === condition.month && date.getDate() === condition.day;

    case 'dayAndWeekday':
      return date.getDate() === condition.day && date.getDay() === condition.weekday;

    case 'anniversary': {
      const created = context.userCreatedAt;
      const yearsDiff = date.getFullYear() - created.getFullYear();
      return yearsDiff >= 1 && date.getMonth() === created.getMonth() && date.getDate() === created.getDate();
    }

    case 'range':
      return date >= new Date(condition.from) && date <= new Date(condition.until);

    default:
      return false;
  }
}

/**
 * Time-based trigger: check if the event happened at a specific time
 */
function evaluateTimeTrigger(trigger: TimeTrigger, context: EvaluationContext): boolean {
  const hour = context.event.timestamp.getHours();
  const condition = trigger.condition;

  switch (condition.type) {
    case 'after':
      return hour >= condition.hour;

    case 'before':
      return hour < condition.hour;

    case 'between':
      // Handle overnight ranges (e.g., 22:00 to 05:00)
      if (condition.fromHour <= condition.toHour) {
        return hour >= condition.fromHour && hour < condition.toHour;
      }
      return hour >= condition.fromHour || hour < condition.toHour;

    default:
      return false;
  }
}

/**
 * Streak-based trigger: check if user has maintained a streak
 */
function evaluateStreakTrigger(trigger: StreakTrigger, context: EvaluationContext): boolean {
  switch (trigger.activity) {
    case 'orderedInWeek':
    case 'orderedInMonth':
      return getMetricValue('currentOrderStreak', context.stats) >= trigger.count;
    case 'ledGroupOrder':
      return getMetricValue('groupOrdersLed', context.stats) >= trigger.count;
    default:
      return false;
  }
}

/**
 * Combo trigger: all conditions must be met
 */
function evaluateComboTrigger(trigger: ComboTrigger, context: EvaluationContext): boolean {
  return trigger.conditions.every((condition) => evaluateTrigger(condition, context));
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Exports
// ─────────────────────────────────────────────────────────────────────────────

/** Get the event type that triggers an action */
export function getEventForAction(action: string): BadgeEventType | undefined {
  return ACTION_REGISTRY[action]?.event;
}

/** Get all action types */
export function getAllActions(): string[] {
  return Object.keys(ACTION_REGISTRY);
}
