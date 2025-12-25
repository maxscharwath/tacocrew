import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@tacocrew/ui-kit';
import { Award, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { BadgeGrid, BadgeStats } from '@/components/badges';
import { useBadges } from '@/hooks';
import { routes } from '@/lib/routes';

export function badgesLoader() {
  return Response.json({});
}

function BadgesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={`badge-skeleton-${i}`}
            className="aspect-square rounded-2xl"
            delay={i * 50}
          />
        ))}
      </div>
    </div>
  );
}

export function ProfileBadgesRoute() {
  const { t } = useTranslation();
  const { badges, earned, progress, stats, isLoading, error } = useBadges();

  // Create progress map for efficient lookup
  const progressMap = useMemo(() => new Map(progress.map((p) => [p.badgeId, p])), [progress]);

  // Get earned badge IDs as a Set
  const earnedIds = useMemo(() => new Set(earned.map((ub) => ub.badge.id)), [earned]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-brand-400" />
          <div>
            <h1 className="font-bold text-2xl text-white">{t('badges.title')}</h1>
            <p className="mt-1 text-slate-400 text-sm">{t('badges.subtitle')}</p>
          </div>
        </div>
        <BadgesSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6">
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="py-6">
            <p className="text-center text-red-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/20">
            <Award className="h-6 w-6 text-brand-400" />
          </div>
          <div>
            <h1 className="font-bold text-2xl text-white sm:text-3xl">{t('badges.title')}</h1>
            <p className="mt-0.5 text-slate-400 text-sm">{t('badges.subtitle')}</p>
          </div>
        </div>
        <Link
          to={routes.root.profile()}
          className="flex items-center gap-1 text-slate-400 text-sm transition-colors hover:text-white"
        >
          {t('common.back')}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats Hero */}
      {stats && <BadgeStats stats={stats} />}

      {/* All Badges - with inline progress */}
      <Card className="border-white/10 bg-slate-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {t('badges.all.title')}
                <span className="rounded-full bg-brand-500/20 px-2 py-0.5 font-medium text-brand-300 text-xs">
                  {earned.length}/{badges.length}
                </span>
              </CardTitle>
              <CardDescription>
                {t('badges.all.description', { total: badges.length, earned: earned.length })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BadgeGrid badges={badges} earnedIds={earnedIds} progressMap={progressMap} columns={2} />
        </CardContent>
      </Card>
    </div>
  );
}
