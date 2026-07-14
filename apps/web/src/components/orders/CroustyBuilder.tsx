import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@tacocrew/ui-kit';
import { Drumstick, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CroustyOrderInput, CroustyProduct } from '@/lib/api/types';
import { cn } from '@/lib/utils';

type CroustyBuilderProps = Readonly<{
  products: CroustyProduct[];
  /** Configured lines, owned by the order form so they flow into the summary. */
  lines: CroustyOrderInput[];
  onAdd: (line: CroustyOrderInput) => void;
  onRemove: (index: number) => void;
  isSubmitting?: boolean;
}>;

/**
 * Builder for the Tasty Crousty product family. Each variant (Sweet / Spicy /
 * Custom) exposes single-select option groups (size, and for Custom: meat,
 * sauce, toggles). The configured line list is controlled by the order form so
 * the summary total, item count, and save-enable check all include Crousties;
 * only the in-progress selection is held locally.
 */
export function CroustyBuilder({
  products,
  lines,
  onAdd,
  onRemove,
  isSubmitting,
}: CroustyBuilderProps) {
  const { t } = useTranslation();
  const [selectedCode, setSelectedCode] = useState<string | null>(products[0]?.code ?? null);
  const [selections, setSelections] = useState<Record<string, string>>({});

  const selectedProduct = useMemo(
    () => products.find((p) => p.code === selectedCode) ?? null,
    [products, selectedCode]
  );

  if (products.length === 0) return null;

  const requiredGroups = selectedProduct?.optionGroups.filter((g) => g.minSelection >= 1) ?? [];
  const canAdd =
    selectedProduct !== null &&
    requiredGroups.every((g) => selections[g.name] !== undefined) &&
    !isSubmitting;

  const selectProduct = (code: string): void => {
    setSelectedCode(code);
    setSelections({});
  };

  const chooseOption = (groupName: string, optionName: string): void => {
    setSelections((prev) => ({ ...prev, [groupName]: optionName }));
  };

  const addLine = (): void => {
    if (!selectedProduct || !canAdd) return;
    const options = selectedProduct.optionGroups.flatMap((g) => {
      const optionName = selections[g.name];
      return optionName ? [{ groupName: g.name, optionName }] : [];
    });
    onAdd({ code: selectedProduct.code, options, quantity: 1 });
    setSelections({});
  };

  const removeLine = (index: number): void => {
    onRemove(index);
  };

  const productByCode = (code: string): CroustyProduct | undefined =>
    products.find((p) => p.code === code);

  return (
    <Card className="border-white/10 bg-slate-800/30">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <Drumstick size={18} className="text-brand-400" />
          <CardTitle className="text-sm text-white normal-case tracking-normal">
            {t('orders.create.crousty.title')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Variant picker */}
        <div className="flex flex-wrap gap-2">
          {products.map((product) => (
            <button
              key={product.code}
              type="button"
              disabled={!product.in_stock || isSubmitting}
              onClick={() => selectProduct(product.code)}
              className={cn(
                'rounded-xl border px-3 py-2 font-medium text-sm transition-all',
                selectedCode === product.code
                  ? 'border-brand-400/60 bg-brand-500/20 text-white'
                  : 'border-white/10 bg-slate-900/50 text-slate-300 hover:border-brand-400/40',
                !product.in_stock && 'cursor-not-allowed opacity-50'
              )}
            >
              {product.name}
            </button>
          ))}
        </div>

        {/* Option groups for the selected variant */}
        {selectedProduct?.optionGroups.map((group) => (
          <div key={group.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-300 text-xs">{group.name}</span>
              {group.minSelection >= 1 && <span className="text-rose-400 text-xs">*</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const selected = selections[group.name] === option.name;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!option.in_stock || isSubmitting}
                    onClick={() => chooseOption(group.name, option.name)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-xs transition-all',
                      selected
                        ? 'border-brand-400/60 bg-brand-500/20 text-white'
                        : 'border-white/10 bg-slate-900/50 text-slate-300 hover:border-brand-400/40',
                      !option.in_stock && 'cursor-not-allowed line-through opacity-50'
                    )}
                  >
                    {option.name}
                    {option.price && option.price.value > 0 ? (
                      <span className="ml-1 text-slate-400">+{option.price.value.toFixed(2)}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          onClick={addLine}
          disabled={!canAdd}
          className="w-full"
        >
          <Plus size={16} />
          {t('orders.create.crousty.add')}
        </Button>

        {/* Configured lines */}
        {lines.length > 0 && (
          <div className="space-y-2 border-white/10 border-t pt-3">
            {lines.map((line, index) => {
              const product = productByCode(line.code);
              return (
                <div
                  key={`${line.code}-${index}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {product?.name ?? line.code}
                      </span>
                      {product && (
                        <Badge tone="brand" className="text-[10px]">
                          {product.price.value.toFixed(2)} {product.price.currency}
                        </Badge>
                      )}
                    </div>
                    {line.options.length > 0 && (
                      <p className="mt-0.5 truncate text-slate-400 text-xs">
                        {line.options.map((o) => o.optionName).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    disabled={isSubmitting}
                    aria-label={t('orders.create.crousty.remove')}
                    className="shrink-0 rounded-lg border border-white/10 bg-slate-900/60 p-1.5 text-slate-300 transition-all hover:border-rose-400/50 hover:text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
