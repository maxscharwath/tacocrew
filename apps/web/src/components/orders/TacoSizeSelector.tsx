import {
  Avatar,
  AvatarFallback,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tacocrew/ui-kit';
import { CheckCircle2, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StockResponse } from '@/lib/api';
import { TACO_SIZE_CONFIG } from '@/lib/taco-config';
import { cn } from '@/lib/utils';

/**
 * TacoSizeSelector - A presentational component for selecting taco sizes
 * @component
 */
type TacoSizeSelectorProps = {
  readonly sizes: StockResponse['tacos'];
  readonly selected: string;
  readonly onSelect: (size: string) => void;
};

export function TacoSizeSelector({ sizes, selected, onSelect }: TacoSizeSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar color="blue" size="sm" className="sm:size-md">
            <AvatarFallback>
              <Ruler />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-white">{t('orders.create.sizeSection.title')}</CardTitle>
            <CardDescription className="mt-0.5">
              {t('orders.create.sizeSection.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {sizes.map((tacoSize) => {
            const config = TACO_SIZE_CONFIG[tacoSize.code];
            const emoji = config?.emoji;
            const isSelected = selected === tacoSize.code;

            return (
              <button
                key={tacoSize.id}
                type="button"
                onClick={() => onSelect(isSelected ? '' : tacoSize.code)}
                className={cn(
                  'group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200 sm:gap-3 sm:rounded-2xl sm:p-5',
                  isSelected
                    ? 'scale-[1.02] border-brand-400/60 bg-linear-to-br from-brand-500/25 via-brand-500/15 to-sky-500/10 shadow-[0_8px_24px_rgba(99,102,241,0.35)]'
                    : 'border-white/10 bg-slate-800/50 hover:border-brand-400/40 hover:bg-slate-800/70 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]'
                )}
              >
                <div className="relative">
                  <span className="text-3xl transition-transform duration-200 group-hover:scale-110 sm:text-4xl">
                    {emoji}
                  </span>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-slate-900 bg-brand-500 sm:h-6 sm:w-6">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-center">
                  <span className="block font-semibold text-sm text-white">{tacoSize.name}</span>
                  <span className="block font-medium text-brand-200 text-xs">
                    {tacoSize.price.value.toFixed(2)} {tacoSize.price.currency}
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
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
