import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  BADGES,
  type BadgeDefinition,
  getBadgeById as getBadgeDefById,
} from '@/config/badges.config';
import {
  type BadgeProgress,
  getUserBadgeProgress,
  getUserBadgeStats,
  getUserBadges,
  type UserBadgeContext,
} from '@/lib/api/badges';

// ─────────────────────────────────────────────────────────────────────────────
// Hydrated Types (computed from FE config + API data)
// ─────────────────────────────────────────────────────────────────────────────

/** Hydrated badge with FE definition */
export interface UserBadge {
  readonly badge: BadgeDefinition;
  readonly earnedAt: string;
  readonly context: UserBadgeContext | null;
}

/** Hydrated stats computed by FE from definitions */
export interface BadgeStats {
  readonly total: number;
  readonly earned: number;
  readonly byTier: Record<string, number>;
  readonly byCategory: Record<string, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

interface UseBadgesReturn {
  readonly badges: readonly BadgeDefinition[];
  readonly earned: UserBadge[];
  readonly progress: BadgeProgress[];
  readonly stats: BadgeStats | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refresh: () => void;
  readonly getBadgeById: (id: string) => BadgeDefinition | undefined;
  readonly hasBadge: (badgeId: string) => boolean;
  readonly getProgress: (badgeId: string) => BadgeProgress | undefined;
}

const badgesKeys = {
  all: ['badges'] as const,
  earned: () => [...badgesKeys.all, 'earned'] as const,
  progress: () => [...badgesKeys.all, 'progress'] as const,
  stats: () => [...badgesKeys.all, 'stats'] as const,
} as const;

/**
 * Hook for managing badge data
 *
 * Badge definitions come from FE config (with Vite-optimized images).
 * Only user-specific data (earned IDs, progress) is fetched from API.
 * Stats (byTier, byCategory) are computed client-side from FE definitions.
 */
export function useBadges(): UseBadgesReturn {
  const [earnedQuery, progressQuery, statsQuery] = useQueries({
    queries: [
      {
        queryKey: badgesKeys.earned(),
        queryFn: getUserBadges,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
      {
        queryKey: badgesKeys.progress(),
        queryFn: getUserBadgeProgress,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
      {
        queryKey: badgesKeys.stats(),
        queryFn: getUserBadgeStats,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    ],
  });

  // Map earned badges to use FE config definitions
  const earned = useMemo((): UserBadge[] => {
    if (!earnedQuery.data) return [];
    return earnedQuery.data
      .map((ub) => {
        const badge = getBadgeDefById(ub.badgeId);
        if (!badge) return null;
        return {
          badge,
          earnedAt: ub.earnedAt,
          context: ub.context,
        };
      })
      .filter((b): b is UserBadge => b !== null);
  }, [earnedQuery.data]);

  const isLoading = earnedQuery.isLoading || progressQuery.isLoading || statsQuery.isLoading;
  const error = earnedQuery.error || progressQuery.error || statsQuery.error;
  const errorMessage =
    error instanceof Error ? error.message : error ? 'Failed to load badges' : null;

  const hasBadge = useCallback(
    (badgeId: string): boolean => {
      return earned.some((b) => b.badge.id === badgeId);
    },
    [earned]
  );

  const getProgress = useCallback(
    (badgeId: string): BadgeProgress | undefined => {
      return progressQuery.data?.find((p) => p.badgeId === badgeId);
    },
    [progressQuery.data]
  );

  // Compute stats from FE definitions and earned IDs
  const stats = useMemo((): BadgeStats | null => {
    if (isLoading || !statsQuery.data) return null;

    const earnedSet = new Set(statsQuery.data.earnedIds);
    const byTier: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const badge of BADGES) {
      if (earnedSet.has(badge.id)) {
        byTier[badge.tier] = (byTier[badge.tier] || 0) + 1;
        byCategory[badge.category] = (byCategory[badge.category] || 0) + 1;
      }
    }

    return {
      total: BADGES.length,
      earned: earned.length,
      byTier,
      byCategory,
    };
  }, [isLoading, statsQuery.data, earned.length]);

  const refresh = useCallback(() => {
    earnedQuery.refetch();
    progressQuery.refetch();
    statsQuery.refetch();
  }, [earnedQuery, progressQuery, statsQuery]);

  return {
    badges: BADGES,
    earned,
    progress: progressQuery.data ?? [],
    stats,
    isLoading,
    error: errorMessage,
    refresh,
    getBadgeById: getBadgeDefById,
    hasBadge,
    getProgress,
  };
}
