import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BADGES,
  getBadgeById as getBadgeDefById,
  type BadgeDefinition,
} from '@/config/badges.config';
import {
  getUserBadges,
  getUserBadgeProgress,
  getUserBadgeStats,
  type BadgeProgress,
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

interface UseBadgesState {
  readonly earned: UserBadge[];
  readonly progress: BadgeProgress[];
  readonly earnedIds: readonly string[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

interface UseBadgesReturn extends Omit<UseBadgesState, 'earnedIds'> {
  readonly badges: readonly BadgeDefinition[];
  readonly stats: BadgeStats | null;
  readonly refresh: () => Promise<void>;
  readonly getBadgeById: (id: string) => BadgeDefinition | undefined;
  readonly hasBadge: (badgeId: string) => boolean;
  readonly getProgress: (badgeId: string) => BadgeProgress | undefined;
}

const INITIAL_STATE: UseBadgesState = {
  earned: [],
  progress: [],
  earnedIds: [],
  isLoading: true,
  error: null,
};

/**
 * Hook for managing badge data
 *
 * Badge definitions come from FE config (with Vite-optimized images).
 * Only user-specific data (earned IDs, progress) is fetched from API.
 * Stats (byTier, byCategory) are computed client-side from FE definitions.
 */
export function useBadges(): UseBadgesReturn {
  const [state, setState] = useState<UseBadgesState>(INITIAL_STATE);

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [earnedRaw, progress, statsRaw] = await Promise.all([
        getUserBadges(),
        getUserBadgeProgress(),
        getUserBadgeStats(),
      ]);

      // Map earned badges to use FE config definitions (with optimized images)
      const earned: UserBadge[] = earnedRaw
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

      setState({
        earned,
        progress,
        earnedIds: statsRaw.earnedIds,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load badges',
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasBadge = useCallback(
    (badgeId: string): boolean => {
      return state.earned.some((b) => b.badge.id === badgeId);
    },
    [state.earned]
  );

  const getProgress = useCallback(
    (badgeId: string): BadgeProgress | undefined => {
      return state.progress.find((p) => p.badgeId === badgeId);
    },
    [state.progress]
  );

  // Compute stats from FE definitions and earned IDs
  const stats = useMemo((): BadgeStats | null => {
    if (state.isLoading) return null;

    const earnedSet = new Set(state.earnedIds);
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
      earned: state.earned.length,
      byTier,
      byCategory,
    };
  }, [state.isLoading, state.earnedIds, state.earned.length]);

  return {
    badges: BADGES,
    earned: state.earned,
    progress: state.progress,
    stats,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchData,
    getBadgeById: getBadgeDefById,
    hasBadge,
    getProgress,
  };
}
