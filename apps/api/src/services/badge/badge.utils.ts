/**
 * Badge utility functions
 * @module services/badge/utils
 */

import { BADGES } from '@/config/badges.config';
import type { BadgeDefinition } from '@/schemas/badge.schema';

/**
 * Get badge definition by ID
 */
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find((badge) => badge.id === id);
}

/**
 * Get all visible (non-secret) badges
 */
export function getVisibleBadges(): BadgeDefinition[] {
  return BADGES.filter((badge) => !badge.secret);
}

/**
 * Get all currently available badges (within availability window)
 */
export function getAvailableBadges(now: Date = new Date()): BadgeDefinition[] {
  return BADGES.filter((badge) => {
    if (!badge.availability) return true;
    const { from, until } = badge.availability;
    if (from && now < from) return false;
    if (until && now > until) return false;
    return true;
  });
}

/**
 * Get all badges
 */
export function getAllBadges(): readonly BadgeDefinition[] {
  return BADGES;
}
