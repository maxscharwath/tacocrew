import { Settings, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { TacoCard } from '@/components/orders/TacoCard';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/components/ui';
import { resolveImageUrl, UserApi } from '@/lib/api';
import { routes } from '@/lib/routes';

type LoaderData = {
  profile: Awaited<ReturnType<typeof UserApi.getProfile>>;
  previousOrders: Awaited<ReturnType<typeof UserApi.getPreviousOrders>>;
};

export async function profileLoader(_: LoaderFunctionArgs) {
  const [profile, previousOrders] = await Promise.all([
    UserApi.getProfile(),
    UserApi.getPreviousOrders(),
  ]);

  return Response.json({ profile, previousOrders });
}

export function ProfileRoute() {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) => t(`profile.${key}`, options);
  const { profile, previousOrders } = useLoaderData<LoaderData>();

  const userName = profile.name || profile.username || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-10">
      {/* Profile Hero - Spotify Inspired */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/15 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm lg:p-12">
        <div className="-top-24 pointer-events-none absolute right-0 h-60 w-60 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="-bottom-16 pointer-events-none absolute left-10 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative">
          <div className="grid gap-6 md:grid-cols-[minmax(180px,220px)_1fr] lg:grid-cols-[minmax(220px,260px)_1fr]">
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
              <div className="flex flex-1 flex-col gap-6 text-center md:text-left lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col items-center gap-2 md:items-start lg:pr-6">
                  <h1 className="font-bold text-5xl text-white tracking-tight lg:text-6xl">
                    {userName}
                  </h1>
                  {profile.username && (
                    <p className="text-base text-slate-400 lg:text-lg">@{profile.username}</p>
                  )}
                </div>
                <div className="grid w-full max-w-xs flex-shrink-0">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white shadow-black/30 shadow-lg">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.3em]">Orders</p>
                    <p className="font-bold text-3xl text-white">
                      {previousOrders.reduce((sum, order) => sum + order.orderCount, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-6">
                <div className="border-white/10 border-t" />
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <Link to={routes.root.profileDelivery()}>
                    <Button variant="outline" className="gap-2" size="md">
                      <Truck size={18} />
                      {tt('delivery.manageButton')}
                    </Button>
                  </Link>
                  <Link to={routes.root.profileAccount()}>
                    <Button variant="outline" className="gap-2" size="md">
                      <Settings size={18} />
                      {t('account.title')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-white">{tt('previousOrders.title')}</CardTitle>
            <Badge tone="neutral" pill>
              {tt('previousOrders.count', { count: previousOrders.length })}
            </Badge>
          </div>
          <CardDescription>{tt('previousOrders.description')}</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          {previousOrders.length === 0 ? (
            <EmptyState
              title={tt('previousOrders.empty')}
              description={tt('previousOrders.emptyDescription', {
                defaultValue: 'Start ordering to see your favorite tacos here.',
              })}
            />
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
              {previousOrders.map((order) => (
                <TacoCard
                  key={order.tacoID}
                  taco={order.taco}
                  badge={
                    <Badge
                      tone="brand"
                      className="shrink-0 border border-brand-400/50 bg-brand-400/30 px-1.5 py-0.5 font-bold text-[9px]"
                    >
                      {tt('previousOrders.orderedTimes', { count: order.orderCount })}
                    </Badge>
                  }
                  showTacoID
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
