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
import { routes } from '@/lib/routes';
import { UserApi } from '../lib/api';

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

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-6 lg:p-8">
        <div className="-top-24 pointer-events-none absolute right-0 h-60 w-60 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="-bottom-16 pointer-events-none absolute left-10 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="brand" pill>
                {tt('badge')}
              </Badge>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                  {tt('stats.ordersLogged')}
                </p>
                <p className="mt-1 font-bold text-2xl text-white">{previousOrders.length}</p>
                <p className="mt-0.5 text-slate-400 text-xs">
                  {previousOrders.length === 1 ? '1 taco' : `${previousOrders.length} tacos`}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="font-semibold text-2xl text-white tracking-tight lg:text-3xl">
              {profile.name || profile.username || 'User'}
            </h1>
            <p className="text-slate-200 text-sm">{tt('subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-white/10 border-t pt-4">
            <Link to={routes.root.profileDelivery()} className="cursor-pointer">
              <Button variant="outline" className="gap-2" size="sm">
                <Truck size={16} />
                {tt('delivery.manageButton')}
              </Button>
            </Link>
            <div className="flex-1" />
            <Link to={routes.root.profileAccount()} className="cursor-pointer">
              <Button variant="outline" className="gap-2" size="sm">
                <Settings size={16} />
                {t('account.title')}
              </Button>
            </Link>
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
