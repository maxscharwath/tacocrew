import { Badge, Checkbox } from '@tacocrew/ui-kit';
import { useTranslation } from 'react-i18next';
import type { Amount } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/**
 * SelectionGroup - A presentational component for selecting items with checkboxes
 * @component
 */
type SelectionGroupProps = {
  readonly items: Array<{ id: string; name: string; price?: Amount; in_stock: boolean }>;
  readonly selected: string[];
  readonly onToggle: (id: string) => void;
  readonly disabled?: boolean;
  readonly maxSelections?: number;
};

export function SelectionGroup({
  items,
  selected,
  onToggle,
  disabled = false,
  maxSelections,
}: SelectionGroupProps) {
  const { t } = useTranslation();
  const canSelectMore = maxSelections === undefined || selected.length < maxSelections;

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isSelected = selected.includes(item.id);
        const isDisabled = disabled || !item.in_stock || (!isSelected && !canSelectMore);
        const priceValue = item.price?.value ?? 0;
        const currency = item.price?.currency ?? 'CHF';

        return (
          <label
            key={item.id}
            className={cn(
              'group relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition',
              isSelected
                ? 'border-brand-400/50 bg-brand-500/20 shadow-[0_4px_12px_rgba(99,102,241,0.25)]'
                : 'border-white/10 bg-slate-800/50 hover:border-brand-400/30 hover:bg-slate-800/70',
              isDisabled && 'cursor-not-allowed',
              !item.in_stock &&
                'border-slate-700/50 bg-slate-900/40 opacity-60 grayscale hover:border-slate-700/50 hover:bg-slate-900/40'
            )}
          >
            <Checkbox
              checked={isSelected}
              onChange={() => !isDisabled && onToggle(item.id)}
              disabled={isDisabled}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  'block truncate font-medium text-sm',
                  item.in_stock ? 'text-white' : 'text-slate-500 line-through'
                )}
              >
                {item.name}
              </span>
              <div className="mt-0.5 flex items-center gap-2">
                {priceValue > 0 && item.in_stock && (
                  <span className="text-slate-400 text-xs">
                    {priceValue.toFixed(2)} {currency}
                  </span>
                )}
                {!item.in_stock && (
                  <Badge tone="warning" className="px-1.5 py-0 font-semibold text-[9px]">
                    {t('common.outOfStock')}
                  </Badge>
                )}
              </div>
            </div>
            {isSelected && !item.in_stock && (
              <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-slate-600/50 border-dashed bg-slate-900/60" />
            )}
          </label>
        );
      })}
    </div>
  );
}
