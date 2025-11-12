import { CheckCircle } from '@untitledui/icons/CheckCircle';
import { Package } from '@untitledui/icons/Package';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import type { StockResponse } from '@/lib/api';
import { TACO_SIZE_CONFIG } from '@/lib/taco-config';
import { cn } from '@/lib/utils';

/**
 * TacoSizeSelector - A presentational component for selecting taco sizes
 * @component
 */
type TacoSizeSelectorProps = {
  sizes: StockResponse['tacos'];
  selected: string;
  onSelect: (size: string) => void;
  currency: string;
};

export function TacoSizeSelector({ sizes, selected, onSelect, currency }: TacoSizeSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card className="p-6">
      <CardHeader className="gap-3 pb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-brand-400/30 bg-linear-to-br from-brand-400/20 to-sky-500/20">
            <Package size={20} className="text-brand-300" />
          </div>
          <div>
            <CardTitle className="text-white">{t('orders.create.sizeSection.title')}</CardTitle>
            <CardDescription className="mt-0.5">
              {t('orders.create.sizeSection.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sizes.map((tacoSize) => {
            const config = TACO_SIZE_CONFIG[tacoSize.code];
            const emoji = config?.emoji || '🌮';
            const isSelected = selected === tacoSize.code;

            return (
              <div
                key={tacoSize.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(isSelected ? '' : tacoSize.code)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(isSelected ? '' : tacoSize.code);
                  }
                }}
                className={cn(
                  'group relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-200',
                  isSelected
                    ? 'scale-[1.02] border-brand-400/60 bg-linear-to-br from-brand-500/25 via-brand-500/15 to-sky-500/10 shadow-[0_8px_24px_rgba(99,102,241,0.35)]'
                    : 'border-white/10 bg-slate-800/50 hover:border-brand-400/40 hover:bg-slate-800/70 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]'
                )}
              >
                <div className="relative">
                  <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
                    {emoji}
                  </span>
                  {isSelected && (
                    <div className="-top-1 -right-1 absolute grid h-6 w-6 place-items-center rounded-full border-2 border-slate-900 bg-brand-500">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-center">
                  <span className="block font-semibold text-sm text-white">{tacoSize.name}</span>
                  <span className="block font-medium text-brand-200 text-xs">
                    {tacoSize.price.toFixed(2)} {currency}
                  </span>
                  {config && (
                    <span className="block text-slate-400 text-xs">
                      {t('orders.create.sizeSection.limitSummary', {
                        meats: t('orders.create.sizeSection.limits.meats', {
                          count: config.maxMeats,
                        }),
                        sauces: t('orders.create.sizeSection.limits.sauces', {
                          count: config.maxSauces,
                        }),
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
