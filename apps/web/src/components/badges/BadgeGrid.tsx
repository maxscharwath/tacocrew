import { cn, EmptyState } from '@tacocrew/ui-kit';
import { Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BadgeDefinition } from '@/config/badges.config';
import type { UserBadge } from '@/hooks/useBadges';
import type { BadgeProgress } from '@/lib/api/badges';
import { BadgeCard } from './BadgeCard';

interface BadgeGridProps {
  /** Badges to display (can be definitions or earned badges) */
  readonly badges: ReadonlyArray<BadgeDefinition | UserBadge>;
  /** Optional set of earned badge IDs (used when badges are definitions) */
  readonly earnedIds?: ReadonlySet<string>;
  /** Optional progress data map (badgeId -> progress) */
  readonly progressMap?: ReadonlyMap<string, BadgeProgress>;
  /** Grid columns on mobile */
  readonly columns?: 2 | 3 | 4;
  /** Handler for badge click */
  readonly onBadgeClick?: (badge: BadgeDefinition | UserBadge) => void;
  /** Empty state message */
  readonly emptyMessage?: string;
  /** Additional class name */
  readonly className?: string;
}

function getBadgeId(badge: BadgeDefinition | UserBadge): string {
  return 'earnedAt' in badge ? badge.badge.id : badge.id;
}

/**
 * Displays badges in a responsive grid layout with optional progress
 */
export function BadgeGrid({
  badges,
  earnedIds,
  progressMap,
  columns = 3,
  onBadgeClick,
  emptyMessage,
  className,
}: BadgeGridProps) {
  const { t } = useTranslation();

  if (badges.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title={t('badges.empty.title')}
        description={emptyMessage ?? t('badges.empty.description')}
      />
    );
  }

  const columnClasses = {
    2: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    3: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4', columnClasses[columns], className)}>
      {badges.map((badge) => {
        const id = getBadgeId(badge);
        const isEarned = earnedIds ? earnedIds.has(id) : undefined;
        const progress = progressMap?.get(id);

        return (
          <BadgeCard
            key={id}
            badge={badge}
            earned={isEarned}
            progress={progress}
            onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
          />
        );
      })}
    </div>
  );
}
