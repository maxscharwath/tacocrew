import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import { useDateFormat } from '@/hooks/useDateFormat';
import type { PreviousOrder } from '@/lib/api/types';
import { formatTacoSizeName, TACO_SIZE_CONFIG } from '@/lib/taco-config';
import { cn } from '@/lib/utils';

type PreviousTacoCardProps = {
  readonly order: PreviousOrder;
  readonly stock: { tacos: Array<{ code: string }> };
  readonly disabled?: boolean;
  readonly onSelect: (taco: PreviousOrder['taco']) => void;
};

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
        'group hover:-translate-y-0.5 relative flex flex-col rounded-2xl border p-5 transition-all duration-300',
        'border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90',
        'shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40',
        isDisabled && 'cursor-not-allowed opacity-50'
      )}
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
                {t('orders.create.previousTacos.orderedTimes', { count: order.orderCount })}
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
                  key={`meat-${meat.name}-${meat.quantity ?? 1}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-orange-400/25 bg-orange-500/12 px-2.5 py-1 font-semibold text-[11px] text-orange-100"
                >
                  {meat.name}
                  {meat.quantity > 1 && <span className="text-orange-300">×{meat.quantity}</span>}
                </span>
              ))}
            {taco.sauces.length > 0 &&
              taco.sauces.map((sauce, idx) => (
                <span
                  key={`sauce-${sauce.name}-${idx}`}
                  className="inline-flex items-center rounded-lg border border-violet-400/25 bg-violet-500/12 px-2.5 py-1 font-medium text-[11px] text-violet-100"
                >
                  {sauce.name}
                </span>
              ))}
            {taco.garnitures.length > 0 &&
              taco.garnitures.map((garniture, idx) => (
                <span
                  key={`garniture-${garniture.name}-${idx}`}
                  className="inline-flex items-center rounded-lg border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 font-medium text-[11px] text-emerald-100"
                >
                  {garniture.name}
                </span>
              ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-white/10 border-t pt-3">
          <div className="font-semibold text-slate-400 text-xs uppercase tracking-wide">
            {order.recentGroupOrderName || 'Last ordered'}
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Clock size={12} />
            <span>{formatRelativeTime(order.lastOrderedAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
