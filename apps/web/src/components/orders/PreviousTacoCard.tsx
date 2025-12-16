import { Badge } from '@tacocrew/ui-kit';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/useDateFormat';
import type { PreviousOrder } from '@/lib/api/types';
import { formatTacoSizeName, TACO_SIZE_CONFIG } from '@/lib/taco-config';
import { cn } from '@/lib/utils';

type PreviousTacoCardProps = Readonly<{
  order: PreviousOrder;
  stock: { tacos: Array<{ code: string }> };
  disabled?: boolean;
  onSelect: (taco: PreviousOrder['taco']) => void;
}>;

export function PreviousTacoCard({ order, stock, disabled, onSelect }: PreviousTacoCardProps) {
  const { t } = useTranslation();
  const { formatRelativeTime } = useDateFormat();
  const taco = order.taco;
  const tacoConfig = TACO_SIZE_CONFIG[taco.size];
  const tacoSize = stock.tacos.find((t) => t.code === taco.size);
  const sizeName = formatTacoSizeName(taco.size);
  const isDisabled = disabled || !tacoSize;

  return (
    <button
      onClick={() => onSelect(taco)}
      disabled={isDisabled}
      className={cn(
        'group relative flex flex-col rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 sm:rounded-2xl sm:p-5',
        'border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90',
        'shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40',
        isDisabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <div className="flex flex-1 flex-col space-y-2 sm:space-y-3">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-400/50 bg-linear-to-br from-brand-500/30 via-brand-500/20 to-sky-500/25 shadow-brand-500/20 shadow-md sm:h-12 sm:w-12">
            <span className="text-lg sm:text-xl">{tacoConfig.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1 sm:mb-1.5 sm:gap-1.5">
              <Badge
                tone="brand"
                className="shrink-0 border border-brand-400/50 bg-brand-400/30 px-1 py-0.5 font-bold text-[8px] sm:px-1.5 sm:text-[9px]"
              >
                {t('orders.create.previousTacos.orderedTimes', { count: order.orderCount })}
              </Badge>
            </div>
            <p className="font-bold text-white text-xs leading-tight sm:text-sm">{sizeName}</p>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 sm:space-y-2">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {taco.quantity > 1 && (
              <span className="inline-flex items-center rounded-md border border-brand-400/35 bg-brand-500/20 px-1.5 py-0.5 font-semibold text-[9px] text-brand-100 shadow-sm sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[11px]">
                {t('orders.detail.list.tagCounts.tacos', { count: taco.quantity })}
              </span>
            )}
            {taco.meats.length > 0 &&
              taco.meats.map((meat, idx) => (
                <span
                  key={`meat-${meat.name}-${meat.quantity ?? 1}-${idx}`}
                  className="inline-flex items-center gap-0.5 rounded-md border border-orange-400/25 bg-orange-500/12 px-1.5 py-0.5 font-semibold text-[9px] text-orange-100 sm:gap-1 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[11px]"
                >
                  {meat.name}
                  {meat.quantity > 1 && <span className="text-orange-300">×{meat.quantity}</span>}
                </span>
              ))}
            {taco.sauces.length > 0 &&
              taco.sauces.map((sauce, idx) => (
                <span
                  key={`sauce-${sauce.name}-${idx}`}
                  className="inline-flex items-center rounded-md border border-violet-400/25 bg-violet-500/12 px-1.5 py-0.5 font-medium text-[9px] text-violet-100 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[11px]"
                >
                  {sauce.name}
                </span>
              ))}
            {taco.garnitures.length > 0 &&
              taco.garnitures.map((garniture, idx) => (
                <span
                  key={`garniture-${garniture.name}-${idx}`}
                  className="inline-flex items-center rounded-md border border-emerald-400/25 bg-emerald-500/12 px-1.5 py-0.5 font-medium text-[9px] text-emerald-100 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[11px]"
                >
                  {garniture.name}
                </span>
              ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-white/10 border-t pt-2 sm:pt-3">
          <div className="font-semibold text-[10px] text-slate-400 uppercase tracking-wide sm:text-xs">
            {order.recentGroupOrderName || 'Last ordered'}
          </div>
          <div className="flex items-center gap-0.5 text-[10px] text-slate-400 sm:gap-1 sm:text-xs">
            <Clock size={10} className="sm:w-3" />
            <span>{formatRelativeTime(order.lastOrderedAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
