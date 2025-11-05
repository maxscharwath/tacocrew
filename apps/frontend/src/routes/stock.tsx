import { useEffect, useMemo, useState } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
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

const STOCK_SECTIONS: Array<{
  key: keyof StockResponse;
  label: string;
  tone: 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan';
  blurb: string;
}> = [
  { key: 'meats', label: 'Meats', tone: 'rose', blurb: 'Core proteins and signature blends.' },
  {
    key: 'sauces',
    label: 'Sauces',
    tone: 'amber',
    blurb: 'Heat, sweetness, and everything in between.',
  },
  {
    key: 'garnishes',
    label: 'Garnishes',
    tone: 'emerald',
    blurb: 'Fresh toppings to finish every order.',
  },
  {
    key: 'extras',
    label: 'Extras',
    tone: 'violet',
    blurb: 'Add-ons that boost flavour and crunch.',
  },
  { key: 'drinks', label: 'Drinks', tone: 'sky', blurb: 'Keep refreshments chilled and ready.' },
  { key: 'desserts', label: 'Desserts', tone: 'cyan', blurb: 'Sweet endings for every feast.' },
];

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

export function StockRoute() {
  const { stock } = useLoaderData() as LoaderData;
  const sections = useMemo(
    () => STOCK_SECTIONS.filter((section) => stock[section.key]?.length),
    [stock]
  );
  const [activeTab, setActiveTab] = useState<keyof StockResponse>(sections[0]?.key ?? 'meats');

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
    (acc, category) => acc + category.filter((item) => !item.in_stock).length,
    0
  );

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-60 w-60 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge tone="brand" pill className="w-fit">
                Stock intelligence
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                Stay ahead of every ingredient curveball
              </h1>
              <p className="text-sm text-slate-200">
                Monitor meats, sauces, and garnishes at a glance so every delivery lands with the
                perfect crunch.
              </p>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                  <span className="relative inline-flex h-full w-full rounded-full bg-emerald-400" />
                </span>
                Synced live with vendors
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InventoryStat label="Categories" value={totalCategories} />
            <InventoryStat label="Ingredients" value={totalItems} tone="brand" />
            <InventoryStat label="Low stock" value={lowStockCount} tone="warning" />
          </div>
        </div>
      </section>

      <Card className="p-6">
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="text-white">Live stock overview</CardTitle>
            <CardDescription>
              Switch categories to check availability before the kitchen heat turns up.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="gap-6">
          {sections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-10 text-center text-sm text-slate-300">
              No stock data available yet. Sync with vendors to populate the pantry.
            </div>
          ) : (
            <>
              <div
                className="flex flex-wrap gap-2 overflow-x-auto pb-2 pt-2"
                role="tablist"
                aria-label="Stock categories"
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
                        'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition',
                        isActive
                          ? TONE_TAB_ACTIVE_CLASSES[tone]
                          : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-brand-400/40 hover:text-brand-50'
                      )}
                    >
                      {label}
                      <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-200">
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
                      <h2 className="text-lg font-semibold text-white">{currentSection.label}</h2>
                      <p className="text-sm text-slate-300">{currentSection.blurb}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone="success" pill>
                        {inStockCount} in stock
                      </Badge>
                      <Badge tone="neutral" pill>
                        {items.length} total
                      </Badge>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-10 text-center text-sm text-slate-300">
                      No items found for this category.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((item) => (
                        <article
                          key={item.id}
                          className={cn(
                            'space-y-5 rounded-2xl border bg-slate-900/70 p-5 transition hover:border-brand-400/40',
                            item.in_stock ? 'border-white/10' : 'border-rose-400/40 bg-rose-500/10'
                          )}
                        >
                          <header className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-base font-semibold text-white">{item.name}</h3>
                              <span className="rounded-full border border-white/10 bg-slate-800/70 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-400">
                                {item.code}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(item.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-400 transition hover:border-brand-400/50 hover:text-brand-100"
                              title="Copy ID to clipboard"
                            >
                              Copy ID
                            </button>
                          </header>
                          <footer className="flex items-center justify-between">
                            <Badge tone={item.in_stock ? 'success' : 'warning'} pill>
                              {item.in_stock ? 'Available' : 'Out of stock'}
                            </Badge>
                            <span className="text-sm font-semibold text-white">
                              {typeof item.price === 'number' ? (
                                formatPrice(item.price)
                              ) : (
                                <span className="text-xs font-normal text-slate-400">No price</span>
                              )}
                            </span>
                          </footer>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-10 text-center text-sm text-slate-300">
                  No stock data available yet.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type InventoryStatTone = 'neutral' | 'brand' | 'warning';

function InventoryStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: InventoryStatTone;
}) {
  const toneClasses: Record<InventoryStatTone, string> = {
    neutral: 'border-white/12 bg-slate-900/70 text-slate-100',
    brand: 'border-brand-400/40 bg-brand-500/15 text-brand-50',
    warning: 'border-amber-400/40 bg-amber-500/15 text-amber-50',
  };

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-[0.25em]">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function formatPrice(value: number) {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'CHF',
  });
}
