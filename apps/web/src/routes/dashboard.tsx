import { Activity, ArrowUpRight, TrendingUp, Users } from 'lucide-react';
import { Suspense } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { LoaderFunctionArgs } from 'react-router';
import { Await, Link, useLoaderData } from 'react-router';
import { OrderListItem, StatBubble } from '@/components/orders';
import { DashboardSkeleton } from '@/components/skeletons';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '@/components/ui';
import { useDateFormat } from '@/hooks/useDateFormat';
import { UserApi } from '@/lib/api';
import { routes } from '@/lib/routes';
import { toDate } from '@/lib/utils/date';
import { defer } from '@/lib/utils/defer';
import { createDeferredWithAuth, requireSession } from '@/lib/utils/loader-helpers';

async function loadDashboard() {
  const [groupOrders, orderHistory] = await Promise.all([
    createDeferredWithAuth(() => UserApi.getGroupOrders()),
    createDeferredWithAuth(() => UserApi.getOrderHistory()),
  ]);

  const now = new Date();
  const activeOrders = groupOrders.filter((order) => toDate(order.endDate) > now);
  const pendingOrders = groupOrders.filter((order) => order.canAcceptOrders);
  const historyCount = orderHistory.length;

  return {
    metrics: {
      activeOrders: activeOrders.length,
      pendingOrders: pendingOrders.length,
      historyCount,
    },
    groupOrders,
    orderHistory: orderHistory.slice(0, 5),
  };
}

type DashboardLoaderData = Awaited<ReturnType<typeof loadDashboard>>;

export async function dashboardLoader(_: LoaderFunctionArgs) {
  await requireSession();

  return defer({
    data: loadDashboard(),
  });
}

function DashboardContent({ data }: Readonly<{ data: DashboardLoaderData }>) {
  const { t } = useTranslation();
  const { formatDateTime, formatDateTimeRange, formatDayName } = useDateFormat();
  const { metrics, groupOrders, orderHistory } = data;
  const currentDay = formatDayName();

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm lg:p-10">
        <div className="-top-24 absolute right-0 h-60 w-60 animate-pulse rounded-full bg-brand-400/30 blur-3xl" />
        <div className="-bottom-10 absolute left-10 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-brand-500/5" />
        <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge tone="brand" pill className="uppercase tracking-[0.3em]">
              {t('dashboard.kitchenPulse')}
            </Badge>
            <h1 className="font-semibold text-2xl text-white leading-tight tracking-tight lg:text-3xl">
              <Trans
                i18nKey="dashboard.hero.title"
                values={{ day: currentDay }}
                components={{
                  StyledDay: (
                    <span className="relative inline-block bg-linear-to-r from-brand-200 via-purple-200 via-sky-200 to-brand-200 bg-clip-text font-black text-transparent uppercase tracking-wider drop-shadow-[0_0_20px_rgba(99,102,241,0.8)] [text-shadow:0_0_40px_rgba(139,92,246,0.9),0_0_80px_rgba(99,102,241,0.5)]">
                      <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/70 to-transparent bg-clip-text text-transparent" />
                    </span>
                  ),
                }}
              />
            </h1>
            <p className="max-w-2xl text-slate-200 text-sm leading-relaxed">
              {t('dashboard.hero.subtitle')}
            </p>
          </div>

          <div className="grid h-fit w-full grid-cols-1 items-stretch gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:w-fit sm:grid-cols-3 sm:p-5">
            <StatBubble
              icon={Activity}
              label={t('dashboard.metrics.activeOrders')}
              value={metrics.activeOrders}
              tone="brand"
            />
            <StatBubble
              icon={TrendingUp}
              label={t('dashboard.metrics.awaitingSubmission')}
              value={metrics.pendingOrders}
              tone="violet"
            />
            <StatBubble
              icon={Users}
              label={t('dashboard.metrics.ordersOnRecord')}
              value={metrics.historyCount}
              tone="sunset"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card className="shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-white">{t('dashboard.recentGroupOrders.title')}</CardTitle>
              <CardDescription>{t('dashboard.recentGroupOrders.description')}</CardDescription>
            </div>
            <Link
              to={routes.root.orders()}
              className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap font-semibold text-brand-100 text-sm transition hover:text-brand-50"
            >
              {t('dashboard.recentGroupOrders.manageAll')}
              <ArrowUpRight size={16} />
            </Link>
          </CardHeader>
          <CardContent className="gap-4">
            {groupOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/15 border-dashed bg-slate-900/50 p-10 text-center">
                <span className="text-slate-300 text-sm">
                  {t('dashboard.recentGroupOrders.emptyState')}
                </span>
                <Link
                  to={routes.root.orders()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/15 px-4 py-2 font-semibold text-brand-100 text-sm hover:border-brand-400/70"
                >
                  {t('dashboard.recentGroupOrders.launchFirstCycle')}
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            ) : (
              groupOrders
                .slice(0, 5)
                .map((order) => (
                  <OrderListItem
                    key={order.id}
                    order={order}
                    formatDateTimeRange={formatDateTimeRange}
                    unnamedOrderText={t('dashboard.recentGroupOrders.untitledOrder')}
                  />
                ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
          <CardHeader className="flex flex-col gap-3">
            <CardTitle className="text-white">{t('dashboard.latestSubmissions.title')}</CardTitle>
            <CardDescription>{t('dashboard.latestSubmissions.description')}</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {orderHistory.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/15 border-dashed bg-slate-900/50 p-10 text-center">
                <span className="text-slate-300 text-sm">
                  {t('dashboard.latestSubmissions.emptyState')}
                </span>
              </div>
            ) : (
              orderHistory.map((history) => (
                <article
                  key={history.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-[0_20px_60px_rgba(8,47,73,0.25)] hover:border-brand-400/30 sm:gap-6 sm:p-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge tone="brand" pill className="uppercase tracking-[0.3em]">
                        {history.orderType}
                      </Badge>
                      <span className="text-slate-400 text-xs">
                        {t('dashboard.latestSubmissions.requestedFor', {
                          name: history.requestedFor ?? '—',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-200 text-sm">
                      {t('dashboard.latestSubmissions.submitted', {
                        date: formatDateTime(history.createdAt),
                      })}
                    </p>
                  </div>

                  <StatusBadge
                    status={history.status}
                    label={t(`common.status.${history.status}`)}
                    className="text-xs"
                  />
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardRoute() {
  const { data } = useLoaderData<{ data: Promise<DashboardLoaderData> }>();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Await resolve={data}>{(resolvedData) => <DashboardContent data={resolvedData} />}</Await>
    </Suspense>
  );
}
