/**
 * Badge API
 *
 * Note: Badge definitions come from @/config/badges.config (with Vite-optimized images)
 * Only user-specific data is fetched from API
 */

import { apiClient } from '@/lib/api/http';

// ─────────────────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserBadgeContext {
  readonly orderId?: string;
  readonly groupOrderId?: string;
  readonly value?: number;
}

/** API response for earned badge - only badgeId, FE has definitions */
export interface EarnedBadgeResponse {
  readonly badgeId: string;
  readonly earnedAt: string;
  readonly context: UserBadgeContext | null;
}

/** API response for badge progress */
export interface BadgeProgress {
  readonly badgeId: string;
  readonly current: number;
  readonly target: number;
  readonly percentage: number;
}

/** API response for badge stats - FE computes byTier/byCategory */
export interface BadgeStatsResponse {
  readonly total: number;
  readonly earned: number;
  readonly earnedIds: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get current user's earned badges (just IDs, FE has definitions)
 */
export function getUserBadges() {
  return apiClient.get<EarnedBadgeResponse[]>('/api/v1/users/me/badges');
}

/**
 * Get current user's badge statistics (FE computes byTier/byCategory)
 */
export function getUserBadgeStats() {
  return apiClient.get<BadgeStatsResponse>('/api/v1/users/me/badges/stats');
}

/**
 * Get current user's badge progress
 */
export function getUserBadgeProgress() {
  return apiClient.get<BadgeProgress[]>('/api/v1/users/me/badges/progress');
}
