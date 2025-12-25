import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
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

export function getUserBadges() {
  return apiClient.get<EarnedBadgeResponse[]>('/api/v1/users/me/badges');
}

export function getUserBadgeStats() {
  return apiClient.get<BadgeStatsResponse>('/api/v1/users/me/badges/stats');
}

export function getUserBadgeProgress() {
  return apiClient.get<BadgeProgress[]>('/api/v1/users/me/badges/progress');
}

export function useUserBadges(enabled = true) {
  return useQuery<EarnedBadgeResponse[]>({
    queryKey: ['userBadges'],
    queryFn: () => getUserBadges(),
    enabled,
  });
}

export function useUserBadgeStats(enabled = true) {
  return useQuery<BadgeStatsResponse>({
    queryKey: ['userBadgeStats'],
    queryFn: () => getUserBadgeStats(),
    enabled,
  });
}

export function useUserBadgeProgress(enabled = true) {
  return useQuery<BadgeProgress[]>({
    queryKey: ['userBadgeProgress'],
    queryFn: () => getUserBadgeProgress(),
    enabled,
  });
}
