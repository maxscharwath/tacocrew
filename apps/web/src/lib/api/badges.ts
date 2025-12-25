import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserBadgeContext {
  readonly orderId?: string;
  readonly groupOrderId?: string;
  readonly value?: number;
}

export interface EarnedBadgeResponse {
  readonly badgeId: string;
  readonly earnedAt: string;
  readonly context: UserBadgeContext | null;
}

export interface BadgeProgress {
  readonly badgeId: string;
  readonly current: number;
  readonly target: number;
  readonly percentage: number;
}

export interface BadgeStatsResponse {
  readonly total: number;
  readonly earned: number;
  readonly earnedIds: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────────────────────

const badgesKeys = {
  all: () => ['badges'] as const,
  userBadges: (userId: string) => [...badgesKeys.all(), 'user', userId] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useUserBadges(enabled = true) {
  return useQuery<EarnedBadgeResponse[]>({
    queryKey: badgesKeys.userBadges('me'),
    queryFn: () => apiClient.get<EarnedBadgeResponse[]>('/api/v1/users/me/badges'),
    enabled,
  });
}

export function useUserBadgeStats(enabled = true) {
  return useQuery<BadgeStatsResponse>({
    queryKey: [...badgesKeys.userBadges('me'), 'stats'] as const,
    queryFn: () => apiClient.get<BadgeStatsResponse>('/api/v1/users/me/badges/stats'),
    enabled,
  });
}

export function useUserBadgeProgress(enabled = true) {
  return useQuery<BadgeProgress[]>({
    queryKey: [...badgesKeys.userBadges('me'), 'progress'] as const,
    queryFn: () => apiClient.get<BadgeProgress[]>('/api/v1/users/me/badges/progress'),
    enabled,
  });
}
