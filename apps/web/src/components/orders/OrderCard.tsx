import { Avatar, AvatarFallback, Button, Card, CardContent, CardHeader } from '@tacocrew/ui-kit';
import { Dices, Eye } from 'lucide-react';
import { useMemo, useTransition, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetcher } from 'react-router';
import { OrderCardActions } from '@/components/orders/OrderCardActions';
import { OrderTags } from '@/components/orders/OrderTags';
import { UserBadge } from '@/components/orders/UserBadge';
import { OrdersApi } from '@/lib/api';
import { TacoKind, type UserOrderItems, type UserOrderSummary } from '@/lib/api/types';
import { formatTacoSizeName, TACO_SIZE_CONFIG } from '@/lib/taco-config';
import { cn } from '@/lib/utils';
import { convertOrderToUpsertBody } from '@/utils/order-converter';
import { extractOrderItems } from '@/utils/order-item-extractors';

type OrderCardProps = Readonly<{
  order: UserOrderSummary;
  isMyOrder: boolean;
  canEdit: boolean;
  canDelete: boolean;
  orderId: string;
  isSubmitting: boolean;
  isLeader?: boolean;
  isSubmitted?: boolean;
  onDuplicate?: () => void;
  onOrderChange?: () => void;
}>;

export function OrderCard({
  order,
  isMyOrder,
  canEdit,
  canDelete,
  orderId,
  isSubmitting,
  isLeader = false,
  isSubmitted = false,
  onDuplicate,
  onOrderChange,
}: OrderCardProps) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const [revealedItems, setRevealedItems] = useState<UserOrderItems | null>(null);
  const [isPending, startRevealTransition] = useTransition();
  const taco = order.items.tacos?.[0];
  const isMystery = taco?.kind === TacoKind.MYSTERY;
  const hasRevealedItems = revealedItems !== null;
  const canReveal = isMystery && !hasRevealedItems && (isLeader || isSubmitted);

  const handleRevealMystery = async () => {
    if (!canReveal || isPending) return;
    
    try {
      const revealed = await OrdersApi.revealMysteryTacos(orderId, order.id);
      startRevealTransition(() => {
        setRevealedItems(revealed);
      });
    } catch (error) {
      console.error('Failed to reveal mystery tacos:', error);
    }
  };

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

  const displayOrder = hasRevealedItems ? { ...order, items: revealedItems } : order;
  const { meats: meatsList, sauces: saucesList, garnitures: garnituresList, extras: extrasList, drinks: drinksList, desserts: dessertsList } = extractOrderItems(displayOrder);
  const itemCount = (taco ? 1 : 0) + extrasList.length + drinksList.length + dessertsList.length;
  const tacoConfig = taco ? TACO_SIZE_CONFIG[taco.size] : undefined;
  const userName = order.name ?? t('orders.detail.list.unknownUser');

  // Generate random fake badges for mystery tacos
  const fakeBadges = useMemo(() => {
    if (!isMystery || hasRevealedItems || !taco) return null;

    // Use taco ID as seed for consistent randomness
    let seed = taco.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const generateRandomString = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      return Array.from({ length }, () => chars[Math.floor(random() * chars.length)]).join('');
    };

    const meatCount = Math.floor(random() * 3) + 1; // 1-3 meats
    const sauceCount = Math.floor(random() * 3) + 1; // 1-3 sauces
    const garnitureCount = Math.floor(random() * 2) + 0; // 0-1 garnitures

    const selectedMeats = Array.from({ length: meatCount }, () => generateRandomString(Math.floor(random() * 5) + 4)); // 4-8 chars
    const selectedSauces = Array.from({ length: sauceCount }, () => generateRandomString(Math.floor(random() * 5) + 4)); // 4-8 chars
    const selectedGarnitures = Array.from({ length: garnitureCount }, () => generateRandomString(Math.floor(random() * 5) + 4)); // 4-8 chars

    return { meats: selectedMeats, sauces: selectedSauces, garnitures: selectedGarnitures };
  }, [isMystery, hasRevealedItems, taco?.id]);

  return (
    <Card
      className={cn(
        'group relative flex w-full flex-col transition-all duration-500 ease-in-out hover:-translate-y-0.5',
        hasRevealedItems && 'border-emerald-500/40 bg-gradient-to-br from-emerald-900/20 via-slate-900/80 to-teal-900/20 shadow-[0_8px_24px_rgba(16,185,129,0.2)]',
        !hasRevealedItems && isMystery && isMyOrder && 'border-purple-400/60 bg-gradient-to-br from-purple-900/40 via-slate-900/80 to-indigo-900/40 shadow-[0_8px_24px_rgba(139,92,246,0.35)] hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/40',
        !hasRevealedItems && isMystery && !isMyOrder && 'border-purple-500/30 bg-gradient-to-br from-purple-900/30 via-slate-900/70 to-indigo-900/30 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/25',
        !hasRevealedItems && !isMystery && isMyOrder && 'border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40',
        !hasRevealedItems && !isMystery && !isMyOrder && 'border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 hover:border-brand-400/50 hover:shadow-2xl hover:shadow-brand-500/25'
      )}
    >
      <OrderCardActions
        tacoID={taco && taco.kind === TacoKind.REGULAR ? taco.tacoID : undefined}
        orderId={orderId}
        itemId={order.id}
        canEdit={canEdit}
        canDelete={canDelete}
        isSubmitting={isSubmitting || fetcher.state === 'submitting'}
        onDuplicate={handleDuplicate}
      />

      <CardHeader className="pr-20">
        <div className="flex items-start gap-3">
          <Avatar
            color={isMystery ? 'violet' : 'brandHero'}
            size="md"
            variant="elevated"
            className={isMystery ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : undefined}
          >
            <AvatarFallback>
              {isMystery ? (
                <Dices className="h-5 w-5 text-white" />
              ) : (
                <span className="text-xl">{tacoConfig?.emoji}</span>
              )}
            </AvatarFallback>
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
            <p
              className={cn(
                'font-bold text-sm leading-tight',
                isMystery ? 'text-purple-100' : 'text-white'
              )}
            >
              {isMystery
                ? t('orders.create.mystery.summaryTitle')
                : taco?.size
                  ? formatTacoSizeName(taco.size)
                  : t('orders.detail.list.extrasOnly')}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="relative flex-1 space-y-2">
          {isMystery && !hasRevealedItems ? (
            <div className="flex flex-wrap items-center gap-1.5 transition-opacity duration-500 ease-out">
              {taco && (
                <span className="inline-flex items-center rounded-lg border border-purple-400/35 bg-linear-to-r from-purple-500/20 to-indigo-500/20 px-2.5 py-1 font-semibold text-[11px] text-purple-100 shadow-sm transition-all duration-300">
                  <Dices className="mr-1 h-3 w-3 transition-transform duration-300" />
                  {t('orders.detail.list.tagCounts.tacos', { count: taco.quantity ?? 1 })}
                </span>
              )}
              {/* Fake meat badges */}
              {fakeBadges?.meats.map((meat, idx) => (
                <span
                  key={`fake-meat-${idx}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 font-semibold text-[11px] text-orange-200/40 transition-all duration-500 ease-out"
                >
                  <span className="blur-[2px] transition-all duration-500 ease-out">{meat}</span>
                </span>
              ))}
              {/* Fake sauce badges */}
              {fakeBadges?.sauces.map((sauce, idx) => (
                <span
                  key={`fake-sauce-${idx}`}
                  className="inline-flex items-center rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 font-medium text-[11px] text-violet-200/40 transition-all duration-500 ease-out"
                >
                  <span className="blur-[2px] transition-all duration-500 ease-out">{sauce}</span>
                </span>
              ))}
              {/* Fake garniture badges */}
              {fakeBadges?.garnitures.map((garniture, idx) => (
                <span
                  key={`fake-garniture-${idx}`}
                  className="inline-flex items-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 font-medium text-[11px] text-emerald-200/40 transition-all duration-500 ease-out"
                >
                  <span className="blur-[2px] transition-all duration-500 ease-out">{garniture}</span>
                </span>
              ))}
              {extrasList.length > 0 && (
                <span className="inline-flex items-center rounded-lg border border-amber-400/25 bg-amber-500/12 px-2.5 py-1 font-semibold text-[11px] text-amber-100">
                  {t('orders.detail.list.tagCounts.extras', { count: extrasList.length })}
                </span>
              )}
              {drinksList.length > 0 && (
                <span className="inline-flex items-center rounded-lg border border-sky-400/25 bg-sky-500/12 px-2.5 py-1 font-semibold text-[11px] text-sky-100">
                  {t('orders.detail.list.tagCounts.drinks', { count: drinksList.length })}
                </span>
              )}
              {dessertsList.length > 0 && (
                <span className="inline-flex items-center rounded-lg border border-rose-400/25 bg-rose-500/12 px-2.5 py-1 font-semibold text-[11px] text-rose-100">
                  {t('orders.detail.list.tagCounts.desserts', { count: dessertsList.length })}
                </span>
              )}
            </div>
          ) : (
            <div className={cn(
              'space-y-2 transition-all duration-700 ease-in-out',
              hasRevealedItems && 'animate-in fade-in slide-in-from-bottom-2'
            )}>
              <OrderTags
                taco={taco ? { size: taco.size, quantity: taco.quantity } : undefined}
                meats={meatsList}
                sauces={saucesList}
                garnitures={garnituresList}
                extras={extrasList}
                drinks={drinksList}
                desserts={dessertsList}
                kind={hasRevealedItems ? TacoKind.REGULAR : taco?.kind}
              />
            </div>
          )}
        </div>

        {canReveal && (
          <div className={cn(
            'mt-4 transition-all duration-500 ease-in-out',
            hasRevealedItems && 'animate-out fade-out slide-out-to-bottom-2'
          )}>
            <Button
              type="button"
              variant="default"
              color="violet"
              size="md"
              fullWidth
              loading={isPending}
              disabled={isSubmitting || isPending}
              onClick={handleRevealMystery}
              className="gap-2 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              {!isPending && <Eye className="h-4 w-4 transition-transform duration-300 ease-out group-hover:scale-110" />}
              {t('orders.detail.list.revealMystery')}
            </Button>
          </div>
        )}

        <div
          className={cn(
            'mt-auto flex items-center justify-between border-t pt-3',
            isMystery ? 'border-purple-500/20' : 'border-white/10'
          )}
        >
          <div
            className={cn(
              'font-semibold text-xs uppercase tracking-wide',
              isMystery ? 'text-purple-300/80' : 'text-slate-400'
            )}
          >
            {t('orders.detail.list.itemCount', { count: itemCount })}
          </div>
          <div className="text-right">
            <p
              className={cn(
                'font-bold text-xl leading-none',
                isMystery ? 'text-purple-200' : 'text-brand-100'
              )}
            >
              {order.totalPrice.value.toFixed(2)}
            </p>
            <p className="mt-0.5 font-semibold text-[10px] text-slate-400 uppercase tracking-wide">
              {order.totalPrice.currency}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
