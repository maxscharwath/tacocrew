import { AlertTriangle } from '@untitledui/icons/AlertTriangle';
import { Package } from '@untitledui/icons/Package';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { StatBubble } from '@/components/orders';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { StockItem, StockResponse } from '../lib/api';
import { StockApi } from '../lib/api';

type LoaderData = {
  stock: Awaited<ReturnType<typeof StockApi.getStock>>;
};

export async function stockLoader(_: LoaderFunctionArgs) {
  const stock = await StockApi.getStock();
  return Response.json({ stock });
}

const STOCK_SECTIONS = [
  { key: 'meats', tone: 'rose' },
  { key: 'sauces', tone: 'amber' },
  { key: 'garnishes', tone: 'emerald' },
  { key: 'extras', tone: 'violet' },
  { key: 'drinks', tone: 'sky' },
  { key: 'desserts', tone: 'cyan' },
] as const satisfies ReadonlyArray<{
  key: keyof StockResponse;
  tone: 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan';
}>;

const TONE_TAB_ACTIVE_CLASSES: Record<(typeof STOCK_SECTIONS)[number]['tone'], string> = {
  rose: 'border-rose-400/50 bg-rose-500/20 text-rose-50 shadow-[0_12px_40px_rgba(244,114,182,0.25)]',
  amber:
    'border-amber-400/50 bg-amber-500/20 text-amber-50 shadow-[0_12px_40px_rgba(251,191,36,0.25)]',
  emerald:
    'border-emerald-400/50 bg-emerald-500/20 text-emerald-50 shadow-[0_12px_40px_rgba(16,185,129,0.25)]',
  violet:
    'border-violet-400/50 bg-violet-500/20 text-violet-50 shadow-[0_12px_40px_rgba(167,139,250,0.25)]',
  sky: 'border-sky-400/50 bg-sky-500/20 text-sky-50 shadow-[0_12px_40px_rgba(14,165,233,0.25)]',
  cyan: 'border-cyan-400/50 bg-cyan-500/20 text-cyan-50 shadow-[0_12px_40px_rgba(34,211,238,0.25)]',
};

type StockSectionKey = (typeof STOCK_SECTIONS)[number]['key'];

export function StockRoute() {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) => t(`stock.${key}`, options);
  const { stock } = useLoaderData() as LoaderData;
  const sections = STOCK_SECTIONS.map((section) => ({
    ...section,
    label: tt(`sections.${section.key}.label`),
    blurb: tt(`sections.${section.key}.blurb`),
  })).filter((section) => stock[section.key]?.length);
  const [activeTab, setActiveTab] = useState<StockSectionKey>(
    sections[0]?.key ?? STOCK_SECTIONS[0].key
  );

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }

    const stillValid = sections.some((section) => section.key === activeTab);
    if (!stillValid) {
      setActiveTab(sections[0].key);
    }
  }, [sections, activeTab]);

  const currentSection = sections.find((section) => section.key === activeTab) ?? sections[0];
  const items = (currentSection ? stock[currentSection.key] : []) as StockItem[];
  const inStockCount = items.filter((item) => item.in_stock).length;
  const totalCategories = sections.length;
  const totalItems = Object.values(stock).reduce((acc, category) => acc + category.length, 0);
  const lowStockCount = Object.values(stock).reduce(
    (acc, category) =>
      acc + category.filter((item: { in_stock: boolean }) => !item.in_stock).length,
    0
  );

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm lg:p-10">
        <div className="-top-24 absolute right-0 h-60 w-60 animate-pulse rounded-full bg-brand-400/30 blur-3xl" />
        <div className="-bottom-10 absolute left-10 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-brand-500/5" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/50 bg-brand-500/10 px-3 py-1 font-semibold text-brand-100 text-xs uppercase tracking-[0.3em] shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
              {tt('badge')}
            </span>
            <h1 className="font-semibold text-2xl text-white leading-tight tracking-tight lg:text-3xl">
              {tt('title')}
            </h1>
            <p className="max-w-2xl text-slate-200 text-sm leading-relaxed">{tt('subtitle')}</p>
            <div className="flex items-center gap-3 text-emerald-200 text-xs uppercase tracking-[0.3em]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-full w-full rounded-full bg-emerald-400" />
              </span>
              {tt('live')}
            </div>
          </div>

          <div className="grid h-fit w-full grid-cols-1 items-stretch gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:w-fit sm:grid-cols-3 sm:p-5">
            <StatBubble
              icon={Package}
              label={tt('stats.categories')}
              value={totalCategories}
              tone="brand"
            />
            <StatBubble
              icon={Package}
              label={tt('stats.ingredients')}
              value={totalItems}
              tone="violet"
            />
            <StatBubble
              icon={AlertTriangle}
              label={tt('stats.lowStock')}
              value={lowStockCount}
              tone="sunset"
            />
          </div>
        </div>
      </section>

      <Card className="p-6 shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="text-white">{tt('overview.title')}</CardTitle>
            <CardDescription>{tt('overview.description')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="gap-6">
          {sections.length === 0 ? (
            <div className="rounded-2xl border border-white/15 border-dashed bg-slate-900/50 p-10 text-center text-slate-300 text-sm">
              {tt('list.empty')}
            </div>
          ) : (
            <>
              <div
                className="flex flex-wrap gap-2 overflow-x-auto pt-2 pb-2"
                role="tablist"
                aria-label={tt('overview.ariaLabel')}
              >
                {sections.map(({ key, label, tone }) => {
                  const isActive = key === activeTab;
                  return (
                    <button
                      key={key}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(key)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em] transition',
                        isActive
                          ? TONE_TAB_ACTIVE_CLASSES[tone]
                          : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-brand-400/40 hover:text-brand-50'
                      )}
                    >
                      {label}
                      <span className="rounded-full bg-slate-800/80 px-2 py-0.5 font-medium text-[11px] text-slate-200">
                        {stock[key].length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {currentSection ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="font-semibold text-lg text-white">{currentSection.label}</h2>
                      <p className="text-slate-300 text-sm">{currentSection.blurb}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone="success" pill>
                        {tt('stats.counts.inStock', { count: inStockCount })}
                      </Badge>
                      <Badge tone="neutral" pill>
                        {tt('stats.counts.total', { count: items.length })}
                      </Badge>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-white/15 border-dashed bg-slate-900/50 p-10 text-center text-slate-300 text-sm">
                      {tt('list.noItems')}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((item) => (
                        <article
                          key={item.id}
                          className={cn(
                            'space-y-5 rounded-2xl border bg-slate-900/70 p-5 shadow-[0_20px_60px_rgba(8,47,73,0.25)] transition hover:border-brand-400/40 hover:shadow-[0_20px_60px_rgba(99,102,241,0.35)]',
                            item.in_stock
                              ? 'border-white/10'
                              : 'border-rose-400/40 bg-rose-500/10 hover:border-rose-400/60'
                          )}
                        >
                          <header className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-semibold text-base text-white">{item.name}</h3>
                              <span className="rounded-full border border-white/10 bg-slate-800/70 px-3 py-1 text-[11px] text-slate-400 uppercase tracking-[0.3em]">
                                {item.code}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(item.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-400 uppercase tracking-[0.3em] transition hover:border-brand-400/50 hover:text-brand-100"
                              title={tt('list.copyIdTooltip')}
                            >
                              {tt('list.copyId')}
                            </button>
                          </header>
                          <footer className="flex items-center justify-between">
                            <Badge tone={item.in_stock ? 'success' : 'warning'} pill>
                              {item.in_stock
                                ? tt('list.availability.available')
                                : tt('list.availability.outOfStock')}
                            </Badge>
                            <span className="font-semibold text-sm text-white">
                              {typeof item.price === 'number' ? (
                                formatPrice(item.price)
                              ) : (
                                <span className="font-normal text-slate-400 text-xs">
                                  {tt('list.noPrice')}
                                </span>
                              )}
                            </span>
                          </footer>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/15 border-dashed bg-slate-900/50 p-10 text-center text-slate-300 text-sm">
                  {tt('list.empty')}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatPrice(value: number) {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'CHF',
  });
}
