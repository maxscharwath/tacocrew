import { CheckCircle } from '@untitledui/icons/CheckCircle';
import { Copy01 } from '@untitledui/icons/Copy01';
import { Settings01 } from '@untitledui/icons/Settings01';
import { Truck01 } from '@untitledui/icons/Truck01';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { routes } from '@/lib/routes';
import { formatTacoSizeName, TACO_SIZE_CONFIG } from '@/lib/taco-config';
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
  const { profile, previousOrders } = useLoaderData() as LoaderData;
  const [copiedTacoID, setCopiedTacoID] = useState<string | null>(null);

  const handleCopyTacoID = async (tacoID: string) => {
    try {
      await navigator.clipboard.writeText(tacoID);
      setCopiedTacoID(tacoID);
      setTimeout(() => setCopiedTacoID(null), 2000);
    } catch (err) {
      console.error('Failed to copy tacoID:', err);
    }
  };

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
                <Truck01 size={16} />
                {tt('delivery.manageButton')}
              </Button>
            </Link>
            <div className="flex-1" />
            <Link to={routes.root.profileAccount()} className="cursor-pointer">
              <Button variant="outline" className="gap-2" size="sm">
                <Settings01 size={16} />
                {t('account.title')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Card className="p-6 shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
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
            <div className="rounded-2xl border border-white/15 border-dashed bg-slate-900/50 p-10 text-center text-slate-300 text-sm">
              {tt('previousOrders.empty')}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
              {previousOrders.map((order) => {
                const taco = order.taco;
                const tacoConfig = TACO_SIZE_CONFIG[taco.size as keyof typeof TACO_SIZE_CONFIG];
                const sizeName = formatTacoSizeName(taco.size);

                return (
                  <div
                    key={order.tacoID}
                    className="group hover:-translate-y-0.5 relative flex flex-col rounded-2xl border border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-5 shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition-all duration-300 hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40"
                  >
                    <div className="flex flex-1 flex-col space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-brand-400/50 bg-linear-to-br from-brand-500/30 via-brand-500/20 to-sky-500/25 shadow-brand-500/20 shadow-md">
                          <span className="text-xl">{tacoConfig?.emoji || '🌮'}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                              tone="brand"
                              className="shrink-0 border border-brand-400/50 bg-brand-400/30 px-1.5 py-0.5 font-bold text-[9px]"
                            >
                              {tt('previousOrders.orderedTimes', { count: order.orderCount })}
                            </Badge>
                          </div>
                          <p className="font-bold text-sm text-white leading-tight">{sizeName}</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {taco.quantity > 1 && (
                            <span className="inline-flex items-center rounded-lg border border-brand-400/35 bg-brand-500/20 px-2.5 py-1 font-semibold text-[11px] text-brand-100 shadow-sm">
                              {t('orders.detail.list.tagCounts.tacos', { count: taco.quantity })}
                            </span>
                          )}
                          {taco.meats.length > 0 &&
                            taco.meats.map((meat, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-lg border border-orange-400/25 bg-orange-500/12 px-2.5 py-1 font-semibold text-[11px] text-orange-100"
                              >
                                {meat.name}
                                {meat.quantity > 1 && (
                                  <span className="text-orange-300">×{meat.quantity}</span>
                                )}
                              </span>
                            ))}
                          {taco.sauces.length > 0 &&
                            taco.sauces.map((sauce, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-lg border border-violet-400/25 bg-violet-500/12 px-2.5 py-1 font-medium text-[11px] text-violet-100"
                              >
                                {sauce.name}
                              </span>
                            ))}
                          {taco.garnitures.length > 0 &&
                            taco.garnitures.map((garniture, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-lg border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 font-medium text-[11px] text-emerald-100"
                              >
                                {garniture.name}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="mt-auto border-white/10 border-t pt-3">
                        <button
                          onClick={() => handleCopyTacoID(order.tacoID)}
                          className="group flex w-full items-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-2 py-1.5 transition-colors hover:bg-slate-700/50"
                          title="Copy tacoID"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 font-semibold text-[10px] text-slate-400 uppercase tracking-wide">
                              tacoID
                            </div>
                            <div className="truncate font-mono text-slate-300 text-xs">
                              {order.tacoID}
                            </div>
                          </div>
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                            {copiedTacoID === order.tacoID ? (
                              <CheckCircle size={16} className="text-emerald-400" />
                            ) : (
                              <Copy01
                                size={14}
                                className="text-slate-400 transition-colors group-hover:text-brand-300"
                              />
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
