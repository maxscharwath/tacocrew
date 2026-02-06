import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tacocrew/ui-kit';
import { AlertTriangle, CheckCircle2, Copy, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatBubble } from '@/components/orders';
import { SectionWrapper } from '@/components/sections';
import { StockSkeleton } from '@/components/skeletons';
import { useClipboard } from '@/hooks/useClipboard';
import { getInitialSectionKey, useStockSections } from '@/hooks/useStockSections';
import { useStockTabs } from '@/hooks/useStockTabs';
import type { StockResponse } from '@/lib/api';
import { useStock } from '@/lib/api/stock';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/stock-price-formatter';
import { calculateStockStats } from '@/lib/utils/stock-stats';

export function stockLoader() {
  return Response.json({});
}

function StockContent({ stock }: Readonly<{ stock: StockResponse }>) {
  const { t } = useTranslation();

  // Data hooks
  const sections = useStockSections(stock);
  const { activeTab, setActiveTab } = useStockTabs(sections, getInitialSectionKey(sections));
  const { copiedId, handleCopy } = useClipboard();

  // Current section and items
  const currentSection = sections.find((section) => section.key === activeTab) ?? sections[0];
  const items = currentSection ? stock[currentSection.key] : [];

  // Statistics
  const stats = calculateStockStats(stock, activeTab);

  return (
    <div className="w-full space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm lg:p-10">
        <div className="absolute -top-24 right-0 h-60 w-60 animate-pulse rounded-full bg-brand-400/30 blur-3xl" />
        <div className="absolute -bottom-10 left-10 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" />
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
              value={stats.totalCategories}
              tone="brand"
            />
            <StatBubble
              icon={Package}
              label={t(`stock.stats.ingredients`)}
              value={stats.totalItems}
              tone="violet"
            />
            <StatBubble
              icon={AlertTriangle}
              label={t(`stock.stats.lowStock`)}
              value={stats.lowStockCount}
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
                        {t(`stock.stats.counts.inStock`, { count: stats.inStockCount })}
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
                            onClick={() => handleCopy(item.id)}
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

export function StockRoute() {
  const stockQuery = useStock();

  return (
    <SectionWrapper query={stockQuery} skeleton={<StockSkeleton />}>
      {(stock) => <StockContent stock={stock} />}
    </SectionWrapper>
  );
}
