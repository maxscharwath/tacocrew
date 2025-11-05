import { Activity } from '@untitledui/icons/Activity';
import { AlertTriangle } from '@untitledui/icons/AlertTriangle';
import { ArrowUpRight } from '@untitledui/icons/ArrowUpRight';
import { TrendUp01 } from '@untitledui/icons/TrendUp01';
import { Users03 } from '@untitledui/icons/Users03';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoaderFunctionArgs } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '@/components/ui';
import type { StockItem, StockResponse } from '../lib/api';
import { StockApi, UserApi } from '../lib/api';

async function loadDashboard() {
  const [groupOrders, orderHistory, stock] = await Promise.all([
    UserApi.getGroupOrders(),
    UserApi.getOrderHistory(),
    StockApi.getStock(),
  ]);

  const now = new Date();
  const activeOrders = groupOrders.filter((order) => new Date(order.endDate) > now);
  const pendingOrders = groupOrders.filter((order) => order.canAcceptOrders);
  const historyCount = orderHistory.length;

  const lowStock = (Object.entries(stock) as [keyof StockResponse, StockItem[]][])
    .flatMap(([category, items]) =>
      items.filter((item) => !item.in_stock).map((item) => ({ category, item }))
    )
    .slice(0, 6);

  return {
    metrics: {
      activeOrders: activeOrders.length,
      pendingOrders: pendingOrders.length,
      historyCount,
    },
    groupOrders,
    orderHistory: orderHistory.slice(0, 5),
    lowStock,
  };
}

type DashboardLoaderData = Awaited<ReturnType<typeof loadDashboard>>;

export async function dashboardLoader(_: LoaderFunctionArgs) {
  const data = await loadDashboard();
  return Response.json(data);
}

export function DashboardRoute() {
  const { t } = useTranslation();
  const { metrics, groupOrders, orderHistory, lowStock } = useLoaderData() as DashboardLoaderData;
  const nextDispatch = groupOrders
    .filter((order) => new Date(order.endDate) > new Date())
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0]?.endDate;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/15 via-slate-900/80 to-slate-950/90 p-8">
        <div className="pointer-events-none absolute -top-28 right-0 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-12 h-60 w-60 rounded-full bg-purple-500/30 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <Badge tone="brand" pill className="w-fit">
              {t('dashboard.kitchenPulse')}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              {t('dashboard.hero.title')}
            </h1>
            <p className="max-w-2xl text-sm text-slate-200">{t('dashboard.hero.subtitle')}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              icon={Activity}
              tone="brand"
              label={t('dashboard.metrics.activeOrders')}
              value={metrics.activeOrders}
              footnote={t('dashboard.metrics.open')}
            />
            <MetricCard
              icon={TrendUp01}
              tone="warning"
              label={t('dashboard.metrics.awaitingSubmission')}
              value={metrics.pendingOrders}
              footnote={t('dashboard.metrics.drafts')}
            />
            <MetricCard
              icon={Users03}
              tone="neutral"
              label={t('dashboard.metrics.ordersOnRecord')}
              value={metrics.historyCount}
              footnote={
                nextDispatch
                  ? t('dashboard.metrics.nextDispatch', { time: formatTime(nextDispatch) })
                  : '—'
              }
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card className="p-6">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-white">{t('dashboard.recentGroupOrders.title')}</CardTitle>
              <CardDescription>{t('dashboard.recentGroupOrders.description')}</CardDescription>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-100 hover:text-brand-50 cursor-pointer"
            >
              {t('dashboard.recentGroupOrders.manageAll')}
              <ArrowUpRight size={16} />
            </Link>
          </CardHeader>
          <CardContent className="gap-4">
            {groupOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-10 text-center">
                <span className="text-sm text-slate-300">
                  {t('dashboard.recentGroupOrders.emptyState')}
                </span>
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-100 hover:border-brand-400/70 cursor-pointer"
                >
                  {t('dashboard.recentGroupOrders.launchFirstCycle')}
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            ) : (
              groupOrders.slice(0, 5).map((order) => (
                <article
                  key={order.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-brand-400/30 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {order.name ?? t('dashboard.recentGroupOrders.untitledOrder')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTimeRange(order.startDate, order.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-100 hover:border-brand-400/70 cursor-pointer"
                    >
                      {t('common.open')}
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="flex flex-col gap-3">
            <CardTitle className="text-white">{t('dashboard.latestSubmissions.title')}</CardTitle>
            <CardDescription>{t('dashboard.latestSubmissions.description')}</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {orderHistory.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-10 text-center">
                <span className="text-sm text-slate-300">
                  {t('dashboard.latestSubmissions.emptyState')}
                </span>
              </div>
            ) : (
              orderHistory.map((history) => (
                <div
                  key={history.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{history.orderType}</p>
                      <p className="text-xs text-slate-400">
                        {t('dashboard.latestSubmissions.requestedFor', {
                          name: history.requestedFor ?? '—',
                        })}
                      </p>
                    </div>
                    <StatusBadge status={history.status} />
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    {t('dashboard.latestSubmissions.submitted', {
                      date: new Date(history.createdAt).toLocaleString(),
                    })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-white">{t('dashboard.lowStockAlerts.title')}</CardTitle>
            <CardDescription>{t('dashboard.lowStockAlerts.description')}</CardDescription>
          </div>
          <Link
            to="/stock"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-100 hover:text-brand-50"
          >
            {t('dashboard.lowStockAlerts.browseInventory')}
            <ArrowUpRight size={16} />
          </Link>
        </CardHeader>
        <CardContent className="gap-4">
          {lowStock.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-sm text-slate-300">
              {t('dashboard.lowStockAlerts.allInStock')}
            </div>
          ) : (
            lowStock.map(({ category, item }) => (
              <div
                key={`${category}-${item.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-rose-500/20 text-rose-200">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-rose-200/80">
                      {category}
                    </p>
                  </div>
                </div>
                <Badge tone="warning" pill className="text-rose-50">
                  {t('dashboard.lowStockAlerts.outOfStock')}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type MetricCardProps = {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  tone: 'brand' | 'warning' | 'neutral';
  footnote?: string;
};

function MetricCard({ icon: Icon, label, value, tone, footnote }: MetricCardProps) {
  const toneClasses: Record<MetricCardProps['tone'], string> = {
    brand:
      'border-brand-400/30 bg-brand-500/20 text-brand-50 shadow-[0_20px_50px_rgba(99,102,241,0.35)]',
    warning:
      'border-amber-400/30 bg-amber-500/15 text-amber-100 shadow-[0_20px_50px_rgba(251,191,36,0.25)]',
    neutral: 'border-white/10 bg-slate-900/70 text-slate-100',
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border px-4 py-4 text-left ${toneClasses[tone]}`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em]">
        <Icon size={16} className="text-current" />
        {label}
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {footnote ? <p className="text-xs text-slate-200/80">{footnote}</p> : null}
    </div>
  );
}

function formatDateTimeRange(start: string, end: string) {
  return `${formatDateTime(start)} → ${formatDateTime(end)}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
