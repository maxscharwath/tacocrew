import { CheckCircle } from '@untitledui/icons/CheckCircle';
import { Copy01 } from '@untitledui/icons/Copy01';
import { Edit03 } from '@untitledui/icons/Edit03';
import { Tag01 } from '@untitledui/icons/Tag01';
import { Trash01 } from '@untitledui/icons/Trash01';
import { useState } from 'react';
import { Form, Link, useNavigate } from 'react-router';
import { Badge, Button } from '@/components/ui';
import type { StockResponse } from '@/lib/api';
import type { UserOrderSummary } from '@/lib/api/types';
import { formatTacoSizeName, hexToTacoID, TACO_SIZE_CONFIG } from '@/lib/taco-config';
import { cn } from '@/lib/utils';

/**
 * OrderCard - A presentational component for displaying a single order card
 * @component
 */
type OrderCardProps = {
  order: UserOrderSummary;
  isMyOrder: boolean;
  canEdit: boolean;
  canDelete: boolean;
  orderId: string;
  isSubmitting: boolean;
  stock: StockResponse;
  currency: string;
  tt: (key: string, options?: Record<string, unknown>) => string;
  onDelete?: (orderId: string) => void;
};

export function OrderCard({
  order,
  isMyOrder,
  canEdit,
  canDelete,
  orderId,
  isSubmitting,
  stock,
  currency,
  tt,
}: OrderCardProps) {
  const [copiedTacoID, setCopiedTacoID] = useState<string | null>(null);
  const navigate = useNavigate();
  const taco = order.items.tacos[0];
  const meatsList = taco
    ? taco.meats.map((item: { name: string; quantity?: number }) => ({
        name: item.name,
        quantity: item.quantity ?? 1,
      }))
    : [];
  const saucesList = taco ? taco.sauces.map((item: { name: string }) => item.name) : [];
  const garnishesList = taco ? taco.garnitures.map((item: { name: string }) => item.name) : [];
  const extrasList = order.items.extras.map((extra: { name: string }) => extra.name);
  const drinksList = order.items.drinks.map((drink: { name: string }) => drink.name);
  const dessertsList = order.items.desserts.map((dessert: { name: string }) => dessert.name);

  // Calculate total price for this order
  const tacoSizeBasePrice = taco
    ? (() => {
        const tacoSize = stock.tacos.find((t) => t.code === taco.size);
        return tacoSize ? tacoSize.price * (taco.quantity ?? 1) : 0;
      })()
    : 0;
  const meatPrices = taco ? taco.price * (taco.quantity ?? 1) : 0;
  const tacoTotalPrice = tacoSizeBasePrice + meatPrices;

  const totalPrice =
    tacoTotalPrice +
    order.items.extras.reduce(
      (sum: number, extra: { price: number; quantity?: number }) =>
        sum + extra.price * (extra.quantity ?? 1),
      0
    ) +
    order.items.drinks.reduce(
      (sum: number, drink: { price: number; quantity?: number }) =>
        sum + drink.price * (drink.quantity ?? 1),
      0
    ) +
    order.items.desserts.reduce(
      (sum: number, dessert: { price: number; quantity?: number }) =>
        sum + dessert.price * (dessert.quantity ?? 1),
      0
    );

  const itemCount = (taco ? 1 : 0) + extrasList.length + drinksList.length + dessertsList.length;

  const handleDuplicate = () => {
    navigate(`/orders/${orderId}/create?duplicate=${order.id}`);
  };

  const handleCopyTacoID = async () => {
    if (!taco?.tacoID) return;
    try {
      await navigator.clipboard.writeText(taco.tacoID);
      setCopiedTacoID(taco.tacoID);
      setTimeout(() => setCopiedTacoID(null), 2000);
    } catch (err) {
      console.error('Failed to copy tacoID:', err);
    }
  };

  return (
    <div
      className={cn(
        'group hover:-translate-y-0.5 relative flex flex-col rounded-2xl border p-5 transition-all duration-300',
        isMyOrder
          ? 'border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40'
          : 'border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 hover:border-brand-400/50 hover:shadow-2xl hover:shadow-brand-500/25'
      )}
    >
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/70 p-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-opacity delay-150 group-hover:opacity-100">
        {taco?.tacoID && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyTacoID}
            className="h-7 w-7 rounded-lg p-0 transition-transform hover:scale-110 hover:bg-emerald-500/25"
            title={copiedTacoID === taco.tacoID ? 'Copied!' : 'Copy tacoID'}
          >
            {copiedTacoID === taco.tacoID ? (
              <CheckCircle size={14} className="text-emerald-400" />
            ) : (
              <Tag01 size={14} className="text-emerald-300" />
            )}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          className="h-7 w-7 rounded-lg p-0 transition-transform hover:scale-110 hover:bg-blue-500/25"
          title="Duplicate order"
        >
          <Copy01 size={14} className="text-blue-300" />
        </Button>
        {canEdit && (
          <Link to={`/orders/${orderId}/create?orderId=${order.id}`} className="cursor-pointer">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-lg p-0 transition-transform hover:scale-110 hover:bg-brand-500/25"
            >
              <Edit03 size={14} className="text-brand-300" />
            </Button>
          </Link>
        )}
        {canDelete && (
          <Form method="post">
            <input type="hidden" name="_intent" value="delete-user-order" />
            <input type="hidden" name="itemId" value={order.id} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              className="h-7 w-7 rounded-lg p-0 text-rose-400 transition-transform hover:scale-110 hover:bg-rose-500/25 hover:text-rose-300"
            >
              <Trash01 size={14} />
            </Button>
          </Form>
        )}
      </div>

      <div className="flex flex-1 flex-col space-y-3">
        <div className="flex items-start gap-3 pr-20">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-brand-400/50 bg-linear-to-br from-brand-500/30 via-brand-500/20 to-sky-500/25 shadow-brand-500/20 shadow-md">
            <span className="text-xl">
              {taco
                ? (() => {
                    const config = TACO_SIZE_CONFIG[taco.size as keyof typeof TACO_SIZE_CONFIG];
                    return config?.emoji || '🌮';
                  })()
                : '🌮'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {isMyOrder ? (
                <Badge
                  tone="brand"
                  className="shrink-0 border border-brand-400/50 bg-brand-400/30 px-1.5 py-0.5 font-bold text-[9px]"
                >
                  {tt('list.myOrderBadge')}
                </Badge>
              ) : (
                <Badge tone="brand" className="shrink-0 px-2 py-0.5 font-semibold text-[10px]">
                  {order.name ?? tt('list.unknownUser')}
                </Badge>
              )}
            </div>
            <p className="font-bold text-sm text-white leading-tight">
              {taco?.size ? formatTacoSizeName(taco.size) : tt('list.extrasOnly')}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {taco && (
              <span className="inline-flex items-center rounded-lg border border-brand-400/35 bg-brand-500/20 px-2.5 py-1 font-semibold text-[11px] text-brand-100 shadow-sm">
                {tt('list.tagCounts.tacos', { count: taco.quantity ?? 1 })}
              </span>
            )}
            {meatsList.length > 0 &&
              meatsList.map((meat: { name: string; quantity: number }, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg border border-orange-400/25 bg-orange-500/12 px-2.5 py-1 font-semibold text-[11px] text-orange-100"
                >
                  {meat.name}
                  {meat.quantity > 1 && <span className="text-orange-300">×{meat.quantity}</span>}
                </span>
              ))}
            {saucesList.length > 0 &&
              saucesList.map((sauce: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-lg border border-violet-400/25 bg-violet-500/12 px-2.5 py-1 font-medium text-[11px] text-violet-100"
                >
                  {sauce}
                </span>
              ))}
            {garnishesList.length > 0 &&
              garnishesList.map((garnish: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-lg border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 font-medium text-[11px] text-emerald-100"
                >
                  {garnish}
                </span>
              ))}
            {extrasList.length > 0 && (
              <span className="inline-flex items-center rounded-lg border border-amber-400/25 bg-amber-500/12 px-2.5 py-1 font-semibold text-[11px] text-amber-100">
                {tt('list.tagCounts.extras', { count: extrasList.length })}
              </span>
            )}
            {drinksList.length > 0 && (
              <span className="inline-flex items-center rounded-lg border border-sky-400/25 bg-sky-500/12 px-2.5 py-1 font-semibold text-[11px] text-sky-100">
                {tt('list.tagCounts.drinks', { count: drinksList.length })}
              </span>
            )}
            {dessertsList.length > 0 && (
              <span className="inline-flex items-center rounded-lg border border-rose-400/25 bg-rose-500/12 px-2.5 py-1 font-semibold text-[11px] text-rose-100">
                {tt('list.tagCounts.desserts', { count: dessertsList.length })}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-white/10 border-t pt-3">
          <div className="font-semibold text-slate-400 text-xs uppercase tracking-wide">
            {tt('list.itemCount', { count: itemCount })}
          </div>
          <div className="text-right">
            <p className="font-bold text-brand-100 text-xl leading-none">{totalPrice.toFixed(2)}</p>
            <p className="mt-0.5 font-semibold text-[10px] text-slate-400 uppercase tracking-wide">
              {currency}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
