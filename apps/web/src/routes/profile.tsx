import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@tacocrew/ui-kit';
import { Award, Building2, Settings, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { TacoCard } from '@/components/orders/TacoCard';
import { PreviousOrdersSkeleton } from '@/components/profile/PreviousOrdersSkeleton';
import { ProfileHeroSkeleton } from '@/components/profile/ProfileHeroSkeleton';
import { SectionWrapper } from '@/components/sections';
import { useProfileData } from '@/hooks/useProfileData';
import { resolveImageUrl } from '@/lib/api/image-utils';
import { routes } from '@/lib/routes';
import { calculateTotalOrderCount } from '@/lib/utils/profile-utils';
import { formatUsername, getDisplayName, getUserInitials } from '@/lib/utils/user-display';

export function profileLoader() {
  return Response.json({});
}

function ProfileContent() {
  const { t } = useTranslation();

  const { profileQuery, previousOrdersQuery } = useProfileData();

  return (
    <div className="space-y-10">
      <SectionWrapper query={profileQuery} skeleton={<ProfileHeroSkeleton />}>
        {(profile) => {
          const userName = getDisplayName(profile.name, profile.username);
          const userInitials = getUserInitials(userName);

          return (
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/15 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm lg:p-12">
              <div className="pointer-events-none absolute -top-24 right-0 h-60 w-60 rounded-full bg-brand-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />

              <div className="relative">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-[minmax(180px,220px)_1fr] lg:grid-cols-[minmax(220px,260px)_1fr]">
                  {/* Profile Image - stays on the left */}
                  <div className="flex justify-center md:justify-start">
                    <div className="relative w-full max-w-[240px]" style={{ aspectRatio: '1 / 1' }}>
                      {profile.image ? (
                        <div className="absolute inset-0 overflow-hidden rounded-[32px] border border-white/15 bg-linear-to-br from-brand-500 via-brand-600 to-sky-500 shadow-2xl">
                          <img
                            src={resolveImageUrl(profile.image, { size: 240 }) || ''}
                            alt={userName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[32px] border border-white/15 bg-linear-to-br from-brand-500 via-brand-600 to-sky-500 shadow-2xl">
                          <span className="font-bold text-5xl text-white sm:text-6xl lg:text-7xl">
                            {userInitials}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info + Stats */}
                  <div className="flex min-w-0 flex-col">
                    <div className="flex flex-1 flex-col gap-4 text-center sm:gap-6 md:text-left lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-1 flex-col items-center gap-2 md:items-start lg:pr-6">
                        <h1 className="font-bold text-5xl text-white tracking-tight lg:text-6xl">
                          {userName}
                        </h1>
                        {formatUsername(profile.username) && (
                          <p className="text-base text-slate-400 lg:text-lg">
                            {formatUsername(profile.username)}
                          </p>
                        )}
                      </div>
                      <div className="grid w-full max-w-xs flex-shrink-0">
                        <SectionWrapper
                          query={previousOrdersQuery}
                          skeleton={
                            <div className="h-24 rounded-2xl border border-white/10 bg-slate-800 bg-white/5 px-4 py-3" />
                          }
                        >
                          {(previousOrders) => (
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white shadow-black/30 shadow-lg">
                              <p className="text-slate-400 text-xs uppercase tracking-[0.3em]">
                                Orders
                              </p>
                              <p className="font-bold text-3xl text-white">
                                {calculateTotalOrderCount(previousOrders)}
                              </p>
                            </div>
                          )}
                        </SectionWrapper>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-4 sm:pt-6">
                      <div className="border-white/10 border-t" />
                      <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                        <Link to={routes.root.profileDelivery()}>
                          <Button variant="outline" className="gap-2" size="md">
                            <Truck size={18} />
                            {t('profile.delivery.manageButton')}
                          </Button>
                        </Link>
                        <Link to={routes.root.profileAccount()}>
                          <Button variant="outline" className="gap-2" size="md">
                            <Settings size={18} />
                            {t('account.title')}
                          </Button>
                        </Link>
                        <Link to={routes.root.profileOrganizations()}>
                          <Button variant="outline" className="gap-2" size="md">
                            <Building2 size={18} />
                            {t('organizations.title')}
                          </Button>
                        </Link>
                        <Link to={routes.root.profileBadges()}>
                          <Button variant="outline" className="gap-2" size="md">
                            <Award size={18} />
                            {t('badges.title')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }}
      </SectionWrapper>

      <SectionWrapper query={previousOrdersQuery} skeleton={<PreviousOrdersSkeleton />}>
        {(previousOrders) => (
          <Card className="shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
            <CardHeader className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-white">{t('profile.previousOrders.title')}</CardTitle>
                <Badge tone="neutral" pill>
                  {t('profile.previousOrders.count', { count: previousOrders.length })}
                </Badge>
              </div>
              <CardDescription>{t('profile.previousOrders.description')}</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              {previousOrders.length === 0 ? (
                <EmptyState
                  title={t('profile.previousOrders.empty')}
                  description={t('profile.previousOrders.emptyDescription', {
                    defaultValue: 'Start ordering to see your favorite tacos here.',
                  })}
                />
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
                  {previousOrders.map((order: (typeof previousOrders)[number]) => (
                    <TacoCard
                      key={order.tacoID}
                      taco={order.taco}
                      badge={
                        <Badge
                          tone="brand"
                          className="shrink-0 border border-brand-400/50 bg-brand-400/30 px-1.5 py-0.5 font-bold text-[9px]"
                        >
                          {t('profile.previousOrders.orderedTimes', { count: order.orderCount })}
                        </Badge>
                      }
                      showTacoID
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </SectionWrapper>
    </div>
  );
}

export function ProfileRoute() {
  return <ProfileContent />;
}
