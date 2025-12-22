import { cn } from '@tacocrew/ui-kit';
import { useTranslation } from 'react-i18next';
import type { BadgeDefinition, BadgeTier } from '@/config/badges.config';
import type { BadgeProgress as BadgeProgressType } from '@/lib/api/badges';
import { formatBadgeProgressValue } from '@/utils/badge-progress-formatter';

interface BadgeProgressProps {
  /** Badge definition */
  readonly badge: BadgeDefinition;
  /** Progress data */
  readonly progress: BadgeProgressType;
  /** Additional class name */
  readonly className?: string;
}

const tierProgressColors: Record<BadgeTier, string> = {
  bronze: 'from-amber-600 to-amber-500',
  silver: 'from-slate-400 to-slate-300',
  gold: 'from-yellow-500 to-amber-400',
  platinum: 'from-cyan-400 to-sky-300',
  legendary: 'from-purple-500 to-pink-400',
};

/**
 * Displays badge progress with tier-colored progress bar
 */
export function BadgeProgress({ badge, progress, className }: BadgeProgressProps) {
  const { t } = useTranslation();

  const name = t(badge.nameKey, { defaultValue: badge.nameKey });
  const description = t(badge.descriptionKey, { defaultValue: badge.descriptionKey });
  const percentage = Math.min(100, Math.max(0, progress.percentage));

  return (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-slate-700/40',
        'bg-gradient-to-r from-slate-800/60 to-slate-900/60 p-4',
        'transition-all duration-200 hover:border-slate-600/50',
        className
      )}
    >
      {/* Badge image - square with rounded corners */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-700/30 bg-slate-900/80">
        <img
          src={badge.image}
          alt=""
          className="h-full w-full object-contain p-1.5 opacity-50 grayscale"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-semibold text-sm text-white">{name}</h4>
            <p className="truncate text-slate-500 text-xs">{description}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="font-bold text-sm text-white">{formatBadgeProgressValue(badge.id, progress.current)}</span>
            <span className="text-slate-500 text-sm"> / {formatBadgeProgressValue(badge.id, progress.target)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-700/50">
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
                tierProgressColors[badge.tier]
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-medium text-slate-400 text-xs">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}
