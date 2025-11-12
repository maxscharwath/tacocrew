import { Minus } from '@untitledui/icons/Minus';
import { Plus } from '@untitledui/icons/Plus';
import { useTranslation } from 'react-i18next';
import { Badge, Card, CardContent, Label } from '@/components/ui';
import type { StockItem, StockResponse } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import type { MeatSelection, TacoSizeItem } from '@/types/orders';

type MeatSelectorProps = {
  meats: MeatSelection[];
  stock: StockResponse;
  selectedTacoSize: TacoSizeItem | null;
  size: string | null;
  currency: string;
  isSubmitting: boolean;
  updateMeatQuantity: (id: string, delta: number) => void;
};

export function MeatSelector({
  meats,
  stock,
  selectedTacoSize,
  size,
  currency,
  isSubmitting,
  updateMeatQuantity,
}: MeatSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-white/10 bg-slate-800/30">
      <CardContent className="space-y-6 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-brand-400" />
              <Label className="text-sm normal-case tracking-normal">
                {t('common.labels.meats')}
                {size && <span className="ml-1 text-rose-400">*</span>}
              </Label>
            </div>
            <div className="flex items-center gap-3">
              {selectedTacoSize?.maxMeats !== undefined && (
                <span className="text-slate-400 text-xs">
                  {t('orders.create.customizeSection.meatsLimit', {
                    count: meats.reduce((sum, m) => sum + m.quantity, 0),
                    max: selectedTacoSize.maxMeats,
                  })}
                </span>
              )}
              {meats.filter((m) => m.quantity > 0).length > 0 && (
                <Badge tone="brand" className="text-xs">
                  {t('orders.create.customizeSection.meatTypesSelected', {
                    count: meats.filter((m) => m.quantity > 0).length,
                  })}
                </Badge>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stock.meats.map((item) => {
              const existing = meats.find((m) => m.id === item.id);
              const quantity = existing?.quantity ?? 0;
              const hasQuantity = quantity > 0;
              const currentTotal = meats.reduce((sum, m) => sum + m.quantity, 0);
              const canAddMore =
                size &&
                selectedTacoSize &&
                (currentTotal < selectedTacoSize.maxMeats || hasQuantity);
              const isDisabled =
                !size || !selectedTacoSize || !item.in_stock || (!canAddMore && quantity === 0);

              const canClickToAdd =
                quantity === 0 &&
                size &&
                selectedTacoSize &&
                item.in_stock &&
                canAddMore &&
                !isSubmitting;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (canClickToAdd) {
                      updateMeatQuantity(item.id, 1);
                    }
                  }}
                  role={canClickToAdd ? 'button' : undefined}
                  tabIndex={canClickToAdd ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (canClickToAdd && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      updateMeatQuantity(item.id, 1);
                    }
                  }}
                  className={cn(
                    'group relative rounded-2xl border p-4 transition-all duration-200',
                    hasQuantity
                      ? 'scale-[1.01] border-brand-400/60 bg-linear-to-br from-brand-500/25 via-brand-500/15 to-sky-500/10 shadow-[0_8px_24px_rgba(99,102,241,0.35)]'
                      : 'border-white/10 bg-slate-800/50 hover:border-brand-400/40 hover:bg-slate-800/70 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]',
                    canClickToAdd && 'cursor-pointer',
                    isDisabled && quantity === 0 && !canClickToAdd && 'cursor-not-allowed',
                    !item.in_stock &&
                      'border-slate-700/50 bg-slate-900/40 opacity-60 grayscale hover:border-slate-700/50 hover:bg-slate-900/40'
                  )}
                >
                  {!item.in_stock && (
                    <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl border-2 border-slate-600/30 border-dashed bg-slate-900/40" />
                  )}
                  <div className="relative z-0 mb-4 flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate font-semibold text-sm',
                          !item.in_stock ? 'text-slate-500 line-through' : 'text-white'
                        )}
                      >
                        {item.name}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2">
                        {(item.price ?? 0) > 0 && item.in_stock && (
                          <span className="text-slate-400 text-xs">
                            {item.price!.toFixed(2)} {currency}
                          </span>
                        )}
                        {!item.in_stock && (
                          <Badge tone="warning" className="px-1.5 py-0 font-semibold text-[9px]">
                            {t('common.outOfStock')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-white/10 border-t pt-3">
                    <span className="font-medium text-slate-300 text-xs">
                      {t('common.labels.quantity')}
                    </span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => updateMeatQuantity(item.id, -1)}
                        disabled={isSubmitting || quantity <= 0}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-900/60 text-white shadow-sm transition-all hover:scale-105 hover:border-brand-400/50 hover:bg-slate-800/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                      >
                        <Minus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateMeatQuantity(item.id, 1)}
                        disabled={isSubmitting || !item.in_stock || !canAddMore}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-900/60 text-white shadow-sm transition-all hover:scale-105 hover:border-brand-400/50 hover:bg-slate-800/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  {hasQuantity && quantity > 1 && (
                    <div className="absolute top-2 right-2">
                      <Badge tone="brand" className="px-1.5 py-0.5 font-bold text-[10px]">
                        ×{quantity}
                      </Badge>
                    </div>
                  )}
                  {hasQuantity && (
                    <input type="hidden" name={`meat_quantity_${item.id}`} value={quantity} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {meats
          .filter((m) => m.quantity > 0)
          .map((meat) => (
            <input key={meat.id} type="hidden" name="meats" value={meat.id} />
          ))}
      </CardContent>
    </Card>
  );
}
