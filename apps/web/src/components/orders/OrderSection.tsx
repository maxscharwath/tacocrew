import { CheckCircle2 } from 'lucide-react';
import type { ComponentType } from 'react';
import { Badge } from '@/components/ui';

/**
 * OrderSection - A presentational component for displaying a section of order items
 * @component
 */
type OrderSectionProps = {
  readonly title: string;
  readonly items: string[] | Array<{ name: string; quantity?: number }>;
  readonly icon: ComponentType<{ size?: number; className?: string }>;
  readonly emptyText?: string;
  readonly showQuantity?: boolean;
};

export function OrderSection({
  title,
  items,
  icon: Icon,
  emptyText = 'None selected',
  showQuantity: _showQuantity = false, // Reserved for future use
}: OrderSectionProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 border-dashed bg-slate-900/30 p-3">
        <p className="text-slate-500 text-xs">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-brand-400" />
        <span className="font-semibold text-slate-400 text-xs uppercase tracking-[0.2em]">
          {title}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => {
          const name = typeof item === 'string' ? item : item.name;
          const quantity =
            typeof item === 'object' && 'quantity' in item ? item.quantity : undefined;

          return (
            <span
              key={`order-item-${name}-${quantity ?? ''}-${idx}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-400/20 bg-brand-500/10 px-2.5 py-1 font-medium text-brand-100 text-xs"
            >
              <CheckCircle2 size={12} className="text-brand-300" />
              {name}
              {quantity !== undefined && quantity > 1 && (
                <Badge tone="brand" className="px-1.5 py-0 font-semibold text-[9px]">
                  ×{quantity}
                </Badge>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
