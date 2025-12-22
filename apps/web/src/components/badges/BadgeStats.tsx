import { cn } from '@tacocrew/ui-kit';
import { Award, Flame, Star, Target, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BadgeStats as BadgeStatsType } from '@/hooks/useBadges';

interface BadgeStatsProps {
  /** Badge statistics */
  readonly stats: BadgeStatsType;
  /** Additional class name */
  readonly className?: string;
}

/**
 * Hero-style badge statistics display
 */
export function BadgeStats({ stats, className }: BadgeStatsProps) {
  const { t } = useTranslation();

  const percentage = stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0;

  // Determine achievement level based on percentage
  const getAchievementLevel = () => {
    if (percentage >= 100) return { label: 'Completionist', color: 'text-purple-400', icon: Star };
    if (percentage >= 75) return { label: 'Expert', color: 'text-yellow-400', icon: Trophy };
    if (percentage >= 50) return { label: 'Enthusiast', color: 'text-cyan-400', icon: Flame };
    if (percentage >= 25) return { label: 'Explorer', color: 'text-emerald-400', icon: Target };
    return { label: 'Beginner', color: 'text-slate-400', icon: Award };
  };

  const level = getAchievementLevel();
  const LevelIcon = level.icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/10',
        'bg-linear-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90',
        'p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]',
        className
      )}
    >
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative">
        {/* Header with level */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/20">
              <Award className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{t('badges.stats.title')}</h3>
              <div className={cn('flex items-center gap-1.5 text-sm', level.color)}>
                <LevelIcon className="h-4 w-4" />
                <span className="font-medium">{level.label}</span>
              </div>
            </div>
          </div>

          {/* Big percentage */}
          <div className="text-right">
            <div className="font-bold text-4xl text-white">{percentage}%</div>
            <div className="text-slate-400 text-sm">{t('badges.stats.completion')}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-400">{t('badges.stats.progress')}</span>
            <span className="font-medium text-white">
              {stats.earned} / {stats.total}
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-700/50">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000 ease-out',
                'bg-linear-to-r from-brand-500 via-purple-500 to-pink-500',
                'shadow-[0_0_20px_rgba(139,92,246,0.5)]'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/5 p-4 text-center backdrop-blur-sm">
            <div className="mb-1 flex justify-center">
              <div className="rounded-xl bg-yellow-500/20 p-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
            <div className="font-bold text-2xl text-white">{stats.earned}</div>
            <div className="text-slate-400 text-xs">{t('badges.stats.earned')}</div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 text-center backdrop-blur-sm">
            <div className="mb-1 flex justify-center">
              <div className="rounded-xl bg-slate-500/20 p-2">
                <Star className="h-5 w-5 text-slate-300" />
              </div>
            </div>
            <div className="font-bold text-2xl text-white">{stats.total}</div>
            <div className="text-slate-400 text-xs">{t('badges.stats.total')}</div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 text-center backdrop-blur-sm">
            <div className="mb-1 flex justify-center">
              <div className="rounded-xl bg-brand-500/20 p-2">
                <Target className="h-5 w-5 text-brand-400" />
              </div>
            </div>
            <div className="font-bold text-2xl text-white">{stats.total - stats.earned}</div>
            <div className="text-slate-400 text-xs">{t('badges.stats.remaining')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
