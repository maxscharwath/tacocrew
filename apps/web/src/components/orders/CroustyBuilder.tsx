import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tacocrew/ui-kit';
import { CheckCircle2, Drumstick, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CroustyOption, CroustyOrderInput, CroustyProduct } from '@/lib/api/types';
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
 * sauce, toggles). Visual language mirrors the taco builder (card selectors,
 * gradient + check on selection). The configured line list is controlled by
 * the order form so the summary total, item count, and save-enable check all
 * include Crousties; only the in-progress selection is held locally.
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

  const productByCode = (code: string): CroustyProduct | undefined =>
    products.find((p) => p.code === code);

  return (
    <Card>
      <CardHeader className="gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar color="amber" size="sm" className="sm:size-md">
            <AvatarFallback>
              <Drumstick />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-white">{t('orders.create.crousty.title')}</CardTitle>
            <CardDescription className="mt-0.5">
              {t('orders.create.crousty.subtitle')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Variant picker — card selectors like taco sizes */}
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {products.map((product) => {
            const isSelected = selectedCode === product.code;
            return (
              <button
                key={product.code}
                type="button"
                disabled={!product.in_stock || isSubmitting}
                onClick={() => selectProduct(product.code)}
                className={cn(
                  'group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-200 sm:gap-3 sm:rounded-2xl sm:p-4',
                  isSelected
                    ? 'scale-[1.02] border-brand-400/60 bg-linear-to-br from-brand-500/25 via-brand-500/15 to-sky-500/10 shadow-[0_8px_24px_rgba(99,102,241,0.35)]'
                    : 'border-white/10 bg-slate-800/50 hover:border-brand-400/40 hover:bg-slate-800/70 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]',
                  !product.in_stock && 'cursor-not-allowed opacity-50'
                )}
              >
                <div className="relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 rounded-xl border border-white/10 bg-slate-900/60 object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-xl border border-white/10 bg-slate-900/60">
                      <Drumstick className="text-brand-300" size={22} />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-slate-900 bg-brand-500">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="block font-semibold text-sm text-white">{product.name}</span>
                  <span className="block font-medium text-brand-200 text-xs">
                    {product.price.value.toFixed(2)} {product.price.currency}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Option groups for the selected variant */}
        {selectedProduct?.optionGroups.map((group) => (
          <div key={group.id} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-200 text-sm">{group.name}</span>
              {group.minSelection >= 1 && <span className="text-rose-400 text-sm">*</span>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.options.map((option) => (
                <CroustyOptionChip
                  key={option.id}
                  option={option}
                  selected={selections[group.name] === option.name}
                  disabled={!option.in_stock || Boolean(isSubmitting)}
                  onSelect={() => chooseOption(group.name, option.name)}
                />
              ))}
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="default"
          onClick={addLine}
          disabled={!canAdd}
          className="w-full"
        >
          <Plus size={16} />
          {t('orders.create.crousty.add')}
        </Button>

        {/* Configured lines */}
        {lines.length > 0 && (
          <div className="space-y-2 border-white/10 border-t pt-4">
            {lines.map((line, index) => {
              const product = productByCode(line.code);
              return (
                <div
                  key={`${line.code}-${index}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-brand-400/30 bg-brand-500/10 p-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {product?.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-lg border border-white/10 bg-slate-900/60 object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
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
                        <p className="mt-1 text-slate-300 text-xs">
                          {line.options.map((o) => o.optionName).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
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

type CroustyOptionChipProps = Readonly<{
  option: CroustyOption;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}>;

function CroustyOptionChip({ option, selected, disabled, onSelect }: CroustyOptionChipProps) {
  const extra = option.price && option.price.value > 0 ? option.price : null;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group relative flex items-center justify-between gap-2 rounded-xl border p-3 text-left transition',
        selected
          ? 'border-brand-400/50 bg-brand-500/20 shadow-[0_4px_12px_rgba(99,102,241,0.25)]'
          : 'border-white/10 bg-slate-800/50 hover:border-brand-400/30 hover:bg-slate-800/70',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'min-w-0 truncate font-medium text-sm',
          option.in_stock ? 'text-white' : 'text-slate-500 line-through'
        )}
      >
        {option.name}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {extra && (
          <span className="text-slate-400 text-xs">
            +{extra.value.toFixed(2)} {extra.currency}
          </span>
        )}
        {selected && <CheckCircle2 size={16} className="text-brand-300" />}
      </span>
    </button>
  );
}
