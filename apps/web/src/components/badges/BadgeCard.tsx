import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@tacocrew/ui-kit';
import { Award, Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BadgeDefinition, BadgeTier } from '@/config/badges.config';
import type { UserBadge } from '@/hooks/useBadges';
import type { BadgeProgress } from '@/lib/api/badges';

/**
 * Format progress value based on badge type
 * Converts centimes to CHF for money-related badges
 */
function formatProgressValue(badgeId: string, value: number): string {
  // Badges that use totalSpentCentimes should display in CHF
  if (badgeId === 'big-spender') {
    const chfValue = value / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(chfValue);
  }
  // For other badges, display as-is
  return value.toLocaleString();
}

interface BadgeCardProps {
  /** Badge definition or earned badge */
  readonly badge: BadgeDefinition | UserBadge;
  /** Whether the badge has been earned */
  readonly earned?: boolean;
  /** Optional progress data for unearned badges */
  readonly progress?: BadgeProgress;
  /** Optional click handler */
  readonly onClick?: () => void;
  /** Additional class name */
  readonly className?: string;
}

const tierStyles: Record<
  BadgeTier,
  { badge: string; progress: string; glow: string; fallbackBg: string; fallbackIcon: string }
> = {
  bronze: {
    badge: 'bg-amber-600 text-amber-100',
    progress: 'bg-gradient-to-r from-amber-600 to-amber-400',
    glow: 'shadow-[0_0_20px_rgba(217,119,6,0.4)]',
    fallbackBg: 'bg-gradient-to-br from-amber-900/80 to-amber-950',
    fallbackIcon: 'text-amber-500',
  },
  silver: {
    badge: 'bg-slate-500 text-slate-100',
    progress: 'bg-gradient-to-r from-slate-500 to-slate-300',
    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.4)]',
    fallbackBg: 'bg-gradient-to-br from-slate-700/80 to-slate-800',
    fallbackIcon: 'text-slate-400',
  },
  gold: {
    badge: 'bg-yellow-500 text-yellow-950',
    progress: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
    glow: 'shadow-[0_0_25px_rgba(234,179,8,0.5)]',
    fallbackBg: 'bg-gradient-to-br from-yellow-900/80 to-yellow-950',
    fallbackIcon: 'text-yellow-500',
  },
  platinum: {
    badge: 'bg-cyan-400 text-cyan-950',
    progress: 'bg-gradient-to-r from-cyan-500 to-cyan-300',
    glow: 'shadow-[0_0_30px_rgba(34,211,238,0.5)]',
    fallbackBg: 'bg-gradient-to-br from-cyan-900/80 to-cyan-950',
    fallbackIcon: 'text-cyan-400',
  },
  legendary: {
    badge: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    progress: 'bg-gradient-to-r from-purple-600 via-pink-500 to-purple-400',
    glow: 'shadow-[0_0_35px_rgba(168,85,247,0.6)]',
    fallbackBg: 'bg-gradient-to-br from-purple-900/80 to-purple-950',
    fallbackIcon: 'text-purple-400',
  },
};

function isUserBadge(badge: BadgeDefinition | UserBadge): badge is UserBadge {
  return 'earnedAt' in badge;
}

/**
 * Displays a badge card with image, name, description, and progress
 */
export function BadgeCard({ badge, earned, progress, onClick, className }: BadgeCardProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);

  const definition = isUserBadge(badge) ? badge.badge : badge;
  const isEarned = earned ?? isUserBadge(badge);

  const name = t(definition.nameKey, { defaultValue: definition.nameKey });
  const description = t(definition.descriptionKey, { defaultValue: definition.descriptionKey });
  const tierName = t(`badges.tier.${definition.tier}`, { defaultValue: definition.tier });
  const style = tierStyles[definition.tier];

  const showProgress = !isEarned && progress && progress.current > 0;
  const showFallback = !definition.image || imageError;
  const isSecret = definition.secret && !isEarned;

  const card = (
    <div
      className={cn(
        'group relative aspect-square overflow-hidden rounded-2xl',
        'border-2 transition-all duration-300',
        isEarned
          ? cn('border-transparent', style.glow)
          : 'border-slate-700/50 hover:border-slate-600',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Background Image or Fallback */}
      {showFallback ? (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center',
            isEarned ? style.fallbackBg : 'bg-gradient-to-br from-slate-800 to-slate-900'
          )}
        >
          {isSecret ? (
            <Lock className="h-12 w-12 text-slate-600" />
          ) : (
            <Award
              className={cn('h-14 w-14', isEarned ? style.fallbackIcon : 'text-slate-600')}
              strokeWidth={1.5}
            />
          )}
        </div>
      ) : (
        <img
          src={definition.image}
          alt={name}
          onError={() => setImageError(true)}
          className={cn(
            'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
            !isEarned && 'opacity-60 grayscale'
          )}
        />
      )}

      {/* Gradient overlay for text readability */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 h-2/3',
          'bg-gradient-to-t from-black/90 via-black/60 to-transparent',
          'pointer-events-none'
        )}
      />

      {/* Tier Badge - Top Right */}
      <div
        className={cn(
          'absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-1',
          'font-bold text-[10px] uppercase tracking-wider',
          isEarned ? style.badge : 'bg-slate-700/80 text-slate-400'
        )}
      >
        {definition.tier === 'legendary' && isEarned && (
          <Sparkles className="h-3 w-3 animate-pulse" />
        )}
        {tierName}
      </div>

      {/* Content - Bottom */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        {/* Name */}
        <h3
          className={cn(
            'font-bold text-sm leading-tight',
            isEarned ? 'text-white' : 'text-slate-400'
          )}
        >
          {name}
        </h3>

        {/* Description or Secret */}
        {isSecret ? (
          <div className="mt-1 flex items-center gap-1.5 text-slate-500">
            <Lock className="h-3 w-3" />
            <span className="text-xs">{t('badges.secret')}</span>
          </div>
        ) : (
          <p
            className={cn(
              'mt-1 line-clamp-2 text-xs leading-relaxed',
              isEarned ? 'text-slate-300' : 'text-slate-500'
            )}
          >
            {description}
          </p>
        )}

        {/* Progress bar */}
        {showProgress && (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">
                {formatProgressValue(definition.id, progress.current)} / {formatProgressValue(definition.id, progress.target)}
              </span>
              <span className="font-semibold text-white">{progress.percentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/80">
              <div
                className={cn('h-full rounded-full transition-all duration-500', style.progress)}
                style={{ width: `${Math.min(100, progress.percentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Show tooltip for secret unearned badges
  if (isSecret) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent>{t('badges.secretHint')}</TooltipContent>
      </Tooltip>
    );
  }

  return card;
}
