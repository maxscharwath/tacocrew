import { Dices } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TacoKind } from '@/lib/api/types';
import { cn } from '@/lib/utils';

type OrderTagsProps = {
  readonly taco?: { size?: string; quantity?: number };
  readonly meats: Array<{ name: string; quantity: number }>;
  readonly sauces: string[];
  readonly garnitures: string[];
  readonly extras: string[];
  readonly drinks: string[];
  readonly desserts: string[];
  readonly kind?: TacoKind;
};

export function OrderTags({
  taco,
  meats,
  sauces,
  garnitures,
  extras,
  drinks,
  desserts,
  kind,
}: OrderTagsProps) {
  const { t } = useTranslation();
  const isMystery = kind === TacoKind.MYSTERY;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {taco && (
        <span
          className={cn(
            'inline-flex items-center rounded-lg border px-2.5 py-1 font-semibold text-[11px] shadow-sm',
            isMystery
              ? 'border-purple-400/35 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-100'
              : 'border-brand-400/35 bg-brand-500/20 text-brand-100'
          )}
        >
          {isMystery && <Dices className="mr-1 h-3 w-3" />}
          {t('orders.detail.list.tagCounts.tacos', { count: taco.quantity ?? 1 })}
        </span>
      )}
      {isMystery ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-purple-400/30 bg-purple-500/15 px-2.5 py-1 font-semibold text-[11px] text-purple-200">
          <Dices className="h-3 w-3" />
          {t('orders.create.mystery.summaryMeats')}
        </span>
      ) : (
        <>
          {meats.map((meat, idx) => (
            <span
              key={`meat-${meat.name}-${meat.quantity}-${idx}`}
              className="inline-flex items-center gap-1 rounded-lg border border-orange-400/25 bg-orange-500/12 px-2.5 py-1 font-semibold text-[11px] text-orange-100"
            >
              {meat.name}
              {meat.quantity > 1 && <span className="text-orange-300">×{meat.quantity}</span>}
            </span>
          ))}
          {sauces.map((sauce, idx) => (
            <span
              key={`sauce-${sauce}-${idx}`}
              className="inline-flex items-center rounded-lg border border-violet-400/25 bg-violet-500/12 px-2.5 py-1 font-medium text-[11px] text-violet-100"
            >
              {sauce}
            </span>
          ))}
          {garnitures.map((garnish, idx) => (
            <span
              key={`garnish-${garnish}-${idx}`}
              className="inline-flex items-center rounded-lg border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 font-medium text-[11px] text-emerald-100"
            >
              {garnish}
            </span>
          ))}
        </>
      )}
      {extras.length > 0 && (
        <span className="inline-flex items-center rounded-lg border border-amber-400/25 bg-amber-500/12 px-2.5 py-1 font-semibold text-[11px] text-amber-100">
          {t('orders.detail.list.tagCounts.extras', { count: extras.length })}
        </span>
      )}
      {drinks.length > 0 && (
        <span className="inline-flex items-center rounded-lg border border-sky-400/25 bg-sky-500/12 px-2.5 py-1 font-semibold text-[11px] text-sky-100">
          {t('orders.detail.list.tagCounts.drinks', { count: drinks.length })}
        </span>
      )}
      {desserts.length > 0 && (
        <span className="inline-flex items-center rounded-lg border border-rose-400/25 bg-rose-500/12 px-2.5 py-1 font-semibold text-[11px] text-rose-100">
          {t('orders.detail.list.tagCounts.desserts', { count: desserts.length })}
        </span>
      )}
    </div>
  );
}
