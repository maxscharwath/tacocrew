import { useTranslation } from 'react-i18next';
import { useFetcher } from 'react-router';
import { OrderCardActions } from '@/components/orders/OrderCardActions';
import { OrderTags } from '@/components/orders/OrderTags';
import { UserBadge } from '@/components/orders/UserBadge';
import { Avatar, Card, CardContent, CardHeader } from '@/components/ui';
import { useOrderPrice } from '@/hooks/useOrderPrice';
import type { StockResponse } from '@/lib/api';
import { OrdersApi } from '@/lib/api';
import type { UserOrderSummary } from '@/lib/api/types';
import { formatTacoSizeName, TACO_SIZE_CONFIG } from '@/lib/taco-config';
import { cn } from '@/lib/utils';
import { convertOrderToUpsertBody } from '@/utils/order-converter';
import { extractOrderItems } from '@/utils/order-item-extractors';

/**
 * OrderCard - A presentational component for displaying a single order card
 * @component
 */
type OrderCardProps = {
  readonly order: UserOrderSummary;
  readonly isMyOrder: boolean;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
  readonly orderId: string;
  readonly isSubmitting: boolean;
  readonly stock: StockResponse;
  readonly currency: string;
  readonly onDelete?: (orderId: string) => void;
  readonly onDuplicate?: () => void;
  readonly onOrderChange?: () => void;
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
  onDuplicate,
  onOrderChange,
}: OrderCardProps) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const taco = order.items.tacos?.[0];

  // Extract item lists
  const {
    meats: meatsList,
    sauces: saucesList,
    garnitures: garnituresList,
    extras: extrasList,
    drinks: drinksList,
    desserts: dessertsList,
  } = extractOrderItems(order);

  // Calculate price using hook
  const totalPrice = useOrderPrice(order, stock);
  const itemCount = (taco ? 1 : 0) + extrasList.length + drinksList.length + dessertsList.length;

  const handleDuplicate = async () => {
    try {
      const body = convertOrderToUpsertBody(order);
      await OrdersApi.upsertUserOrder(orderId, body);
      onDuplicate?.();
      onOrderChange?.();
    } catch (error) {
      console.error('Failed to duplicate order:', error);
    }
  };

  const tacoConfig = taco ? TACO_SIZE_CONFIG[taco.size] : undefined;
  const userName = order.name ?? t('orders.detail.list.unknownUser');

  return (
    <Card
      className={cn(
        'group hover:-translate-y-0.5 relative flex flex-col transition-all duration-300',
        isMyOrder
          ? 'border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40'
          : 'border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 hover:border-brand-400/50 hover:shadow-2xl hover:shadow-brand-500/25'
      )}
    >
      <OrderCardActions
        tacoID={taco?.tacoID}
        orderId={orderId}
        itemId={order.id}
        canEdit={canEdit}
        canDelete={canDelete}
        isSubmitting={isSubmitting || fetcher.state === 'submitting'}
        onDuplicate={handleDuplicate}
      />

      <CardHeader className="pr-20">
        <div className="flex items-start gap-3">
          <Avatar color="brandHero" size="md" variant="elevated">
            <span className="text-xl">{tacoConfig?.emoji}</span>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {isMyOrder ? (
                <UserBadge
                  userId={order.userId}
                  name={userName}
                  displayName={t('orders.detail.list.myOrderBadge')}
                  variant="highlighted"
                  size="sm"
                />
              ) : (
                <UserBadge userId={order.userId} name={userName} size="sm" />
              )}
            </div>
            <p className="font-bold text-sm text-white leading-tight">
              {taco?.size ? formatTacoSizeName(taco.size) : t('orders.detail.list.extrasOnly')}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-2">
          <OrderTags
            taco={taco ? { size: taco.size, quantity: taco.quantity } : undefined}
            meats={meatsList}
            sauces={saucesList}
            garnitures={garnituresList}
            extras={extrasList}
            drinks={drinksList}
            desserts={dessertsList}
          />
        </div>

        <div className="mt-auto flex items-center justify-between border-white/10 border-t pt-3">
          <div className="font-semibold text-slate-400 text-xs uppercase tracking-wide">
            {t('orders.detail.list.itemCount', { count: itemCount })}
          </div>
          <div className="text-right">
            <p className="font-bold text-brand-100 text-xl leading-none">{totalPrice.toFixed(2)}</p>
            <p className="mt-0.5 font-semibold text-[10px] text-slate-400 uppercase tracking-wide">
              {currency}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
