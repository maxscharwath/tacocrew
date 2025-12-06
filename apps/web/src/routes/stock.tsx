import { AlertTriangle, CheckCircle2, Copy, Package } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoaderFunctionArgs } from 'react-router';
import { Await, useLoaderData } from 'react-router';
import { StatBubble } from '@/components/orders';
import { StockSkeleton } from '@/components/skeletons';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import type { StockResponse } from '@/lib/api';
import { StockApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { defer } from '@/lib/utils/defer';
import { createDeferredWithAuth, requireSession } from '@/lib/utils/loader-helpers';

type LoaderData = {
  stock: Awaited<ReturnType<typeof StockApi.getStock>>;
};

export async function stockLoader(_: LoaderFunctionArgs) {
  await requireSession();

  return defer({
    stock: createDeferredWithAuth(() => StockApi.getStock()),
  });
}

const STOCK_SECTIONS = [
  { key: 'meats', tone: 'rose' as const },
  { key: 'sauces', tone: 'amber' as const },
  { key: 'garnishes', tone: 'emerald' as const },
  { key: 'extras', tone: 'violet' as const },
  { key: 'drinks', tone: 'sky' as const },
  { key: 'desserts', tone: 'cyan' as const },
] as const satisfies ReadonlyArray<{
  key: keyof StockResponse;
  tone: 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'brand';
}>;

type StockSectionKey = (typeof STOCK_SECTIONS)[number]['key'];

function StockContent({ stock }: Readonly<{ stock: LoaderData['stock'] }>) {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const sections = STOCK_SECTIONS.map((section) => ({
    ...section,
    label: t(`stock.sections.${section.key}.label`),
    blurb: t(`stock.sections.${section.key}.blurb`),
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
  const items = currentSection ? stock[currentSection.key] : [];
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
        <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge tone="brand" pill className="uppercase tracking-[0.3em]">
              {t(`stock.badge`)}
            </Badge>
            <h1 className="font-semibold text-2xl text-white leading-tight tracking-tight lg:text-3xl">
              {t(`stock.title`)}
            </h1>
            <p className="max-w-2xl text-slate-200 text-sm leading-relaxed">
              {t(`stock.subtitle`)}
            </p>
            <div className="flex items-center gap-3 text-emerald-200 text-xs uppercase tracking-[0.3em]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-full w-full rounded-full bg-emerald-400" />
              </span>
              {t(`stock.live`)}
            </div>
          </div>

          <div className="grid h-fit w-full grid-cols-1 items-stretch gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:w-fit sm:grid-cols-3 sm:p-5">
            <StatBubble
              icon={Package}
              label={t(`stock.stats.categories`)}
              value={totalCategories}
              tone="brand"
            />
            <StatBubble
              icon={Package}
              label={t(`stock.stats.ingredients`)}
              value={totalItems}
              tone="violet"
            />
            <StatBubble
              icon={AlertTriangle}
              label={t(`stock.stats.lowStock`)}
              value={lowStockCount}
              tone="sunset"
            />
          </div>
        </div>
      </section>

      <Card className="shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="text-white">{t(`stock.overview.title`)}</CardTitle>
            <CardDescription>{t(`stock.overview.description`)}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="gap-4 sm:gap-6">
          {sections.length === 0 ? (
            <div className="rounded-2xl border border-white/15 border-dashed bg-slate-900/50 p-10 text-center text-slate-300 text-sm">
              {t(`stock.list.empty`)}
            </div>
          ) : (
            <>
              <div
                className="flex flex-wrap gap-2 overflow-x-auto pt-2 pb-2"
                role="tablist"
                aria-label={t(`stock.overview.ariaLabel`)}
              >
                {sections.map(({ key, label, tone }) => {
                  const isActive = key === activeTab;
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant="tab"
                      color={isActive ? tone : undefined}
                      pill
                      size="sm"
                      onClick={() => setActiveTab(key)}
                      className="uppercase"
                    >
                      {label}
                      <Badge tone="neutral" pill>
                        {stock[key].length}
                      </Badge>
                    </Button>
                  );
                })}
              </div>

              {currentSection ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="font-semibold text-lg text-white">{currentSection.label}</h2>
                      <p className="text-slate-300 text-sm">{currentSection.blurb}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone="success" pill>
                        {t(`stock.stats.counts.inStock`, { count: inStockCount })}
                      </Badge>
                      <Badge tone="neutral" pill>
                        {t(`stock.stats.counts.total`, { count: items.length })}
                      </Badge>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-white/15 border-dashed bg-slate-900/50 p-10 text-center text-slate-300 text-sm">
                      {t(`stock.list.noItems`)}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((item) => (
                        <article
                          key={item.id}
                          className={cn(
                            'relative space-y-4 rounded-2xl border bg-slate-900/70 p-3 shadow-[0_20px_60px_rgba(8,47,73,0.25)] transition hover:border-brand-400/40 hover:shadow-[0_20px_60px_rgba(99,102,241,0.35)] sm:space-y-5 sm:p-5',
                            item.in_stock
                              ? 'border-white/10'
                              : 'border-rose-400/40 bg-rose-500/10 hover:border-rose-400/60'
                          )}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyId(item.id)}
                            className="absolute top-4 right-4 z-10 h-8 w-8 rounded-lg p-0 transition-transform hover:scale-110 hover:bg-emerald-500/25"
                            title={
                              copiedId === item.id
                                ? t(`stock.list.copied`)
                                : t(`stock.list.copyIdTooltip`)
                            }
                          >
                            {copiedId === item.id ? (
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            ) : (
                              <Copy
                                size={14}
                                className="text-slate-400 transition-colors hover:text-emerald-300"
                              />
                            )}
                          </Button>
                          <header className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-semibold text-base text-white">{item.name}</h3>
                            </div>
                          </header>
                          <footer className="flex items-center justify-between">
                            <Badge tone={item.in_stock ? 'success' : 'warning'} pill>
                              {item.in_stock
                                ? t(`stock.list.availability.available`)
                                : t(`stock.list.availability.outOfStock`)}
                            </Badge>
                            <span className="font-semibold text-sm text-white">
                              {item.price ? (
                                formatPrice(item.price)
                              ) : (
                                <span className="font-normal text-slate-400 text-xs">
                                  {t(`stock.list.noPrice`)}
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
                  {t(`stock.list.empty`)}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatPrice(amount: { value: number; currency: string }) {
  return amount.value.toLocaleString(undefined, {
    style: 'currency',
    currency: amount.currency,
  });
}

export function StockRoute() {
  const { stock } = useLoaderData<{ stock: Promise<LoaderData['stock']> }>();

  return (
    <Suspense fallback={<StockSkeleton />}>
      <Await resolve={stock}>{(resolvedStock) => <StockContent stock={resolvedStock} />}</Await>
    </Suspense>
  );
}
