/**
 * Order Card Component
 * Professional approach: Configuration-driven styling, small focused components
 * Replaces deeply nested ternaries with lookup tables
 */

import { Avatar, AvatarFallback, Button, Card, CardContent, CardHeader } from '@tacocrew/ui-kit';
import { Dices, Eye } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetcher } from 'react-router';
import {
  CARD_BASE_CLASSES,
  CARD_STYLES,
  getBorderColor,
  getCardVariant,
  TEXT_COLORS,
} from '@/components/orders/OrderCard.styles';
import { OrderCardActions } from '@/components/orders/OrderCardActions';
import { OrderTags } from '@/components/orders/OrderTags';
import { UserBadge } from '@/components/orders/UserBadge';
import { useRevealMysteryTacos, useUpsertUserOrder } from '@/lib/api/orders';
import { TacoKind, type UserOrderItems, type UserOrderSummary } from '@/lib/api/types';
import { formatTacoSizeName, TACO_SIZE_CONFIG } from '@/lib/taco-config';
import { cn } from '@/lib/utils';
import { convertOrderToUpsertBody } from '@/utils/order-converter';
import { extractOrderItems } from '@/utils/order-item-extractors';

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Reveal button - Shows when mystery taco can be revealed
 */
function RevealButton({
  canReveal,
  hasRevealedItems,
  isPending,
  isSubmitting,
  revealMutation,
  onReveal,
  t,
}: Readonly<{
  canReveal: boolean;
  hasRevealedItems: boolean;
  isPending: boolean;
  isSubmitting: boolean;
  revealMutation: ReturnType<typeof useRevealMysteryTacos>;
  onReveal: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}>) {
  if (!canReveal) return null;

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-in-out',
        hasRevealedItems && 'fade-out slide-out-to-bottom-2 animate-out',
        'mt-4'
      )}
    >
      <Button
        type="button"
        variant="default"
        color="violet"
        size="md"
        fullWidth
        loading={isPending || revealMutation.isPending}
        disabled={isSubmitting || isPending || revealMutation.isPending}
        onClick={onReveal}
        className="gap-2 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
      >
        {!isPending && (
          <Eye className="h-4 w-4 transition-transform duration-300 ease-out group-hover:scale-110" />
        )}
        {t('orders.detail.list.revealMystery')}
      </Button>
    </div>
  );
}

/**
 * Generate fake badges for mystery tacos (deterministic randomization)
 */
function generateFakeBadges(tacoId: string): {
  meats: string[];
  sauces: string[];
  garnitures: string[];
} {
  let seed = tacoId.split('').reduce((acc, char) => acc + char.codePointAt(0)!, 0);

  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return Array.from({ length }, () => chars[Math.floor(random() * chars.length)]).join('');
  };

  const meatCount = Math.floor(random() * 3) + 1;
  const sauceCount = Math.floor(random() * 3) + 1;
  const garnitureCount = Math.floor(random() * 2);

  const selectedMeats = Array.from({ length: meatCount }, () =>
    generateRandomString(Math.floor(random() * 5) + 4)
  );
  const selectedSauces = Array.from({ length: sauceCount }, () =>
    generateRandomString(Math.floor(random() * 5) + 4)
  );
  const selectedGarnitures = Array.from({ length: garnitureCount }, () =>
    generateRandomString(Math.floor(random() * 5) + 4)
  );

  return { meats: selectedMeats, sauces: selectedSauces, garnitures: selectedGarnitures };
}

/**
 * Fake badges for mystery tacos before reveal
 */
function FakeBadges({
  meats,
  sauces,
  garnitures,
  extrasList,
  drinksList,
  dessertsList,
  t,
  taco,
}: Readonly<{
  meats: string[];
  sauces: string[];
  garnitures: string[];
  extrasList: string[];
  drinksList: string[];
  dessertsList: string[];
  t: ReturnType<typeof useTranslation>['t'];
  taco: { quantity?: number } | undefined;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 transition-opacity duration-500 ease-out">
      {taco && (
        <span className="inline-flex items-center rounded-lg border border-purple-400/35 bg-linear-to-r from-purple-500/20 to-indigo-500/20 px-2.5 py-1 font-semibold text-[11px] text-purple-100 shadow-sm transition-all duration-300">
          <Dices className="mr-1 h-3 w-3 transition-transform duration-300" />
          {t('orders.detail.list.tagCounts.tacos', { count: taco.quantity ?? 1 })}
        </span>
      )}
      {meats.map((meat, idx) => (
        <span
          key={`fake-meat-${idx}`}
          className="inline-flex items-center gap-1 rounded-lg border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 font-semibold text-[11px] text-orange-200/40 transition-all duration-500 ease-out"
        >
          <span className="blur-[2px] transition-all duration-500 ease-out">{meat}</span>
        </span>
      ))}
      {sauces.map((sauce, idx) => (
        <span
          key={`fake-sauce-${idx}`}
          className="inline-flex items-center rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 font-medium text-[11px] text-violet-200/40 transition-all duration-500 ease-out"
        >
          <span className="blur-[2px] transition-all duration-500 ease-out">{sauce}</span>
        </span>
      ))}
      {garnitures.map((garniture, idx) => (
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
  );
}

// ============================================================================
// Main Component
// ============================================================================

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

/**
 * Order card - Clean component leveraging configuration-driven styling
 */
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
  const upsertOrder = useUpsertUserOrder();
  const [revealedItems, setRevealedItems] = useState<UserOrderItems | null>(null);
  const revealMutation = useRevealMysteryTacos(orderId, order.id, (revealed) => {
    setRevealedItems(revealed);
  });
  const [isPending] = useTransition();

  // Computed values
  const taco = order.items.tacos?.[0];
  const isMystery = taco?.kind === TacoKind.MYSTERY;
  const hasRevealedItems = revealedItems !== null;
  const canReveal = isMystery && !hasRevealedItems && (isLeader || isSubmitted);

  // Card styling using configuration-driven approach
  const cardVariant = getCardVariant({ hasRevealed: hasRevealedItems, isMystery, isMyOrder });
  const cardClassName = cn(CARD_BASE_CLASSES, CARD_STYLES[cardVariant]);

  const titleColor = TEXT_COLORS.title[isMystery ? 'mystery' : 'regular'];
  const footerBorderColor = getBorderColor(isMystery);
  const footerTextColor = TEXT_COLORS.footer[isMystery ? 'mystery' : 'regular'];
  const priceColor = TEXT_COLORS.price[isMystery ? 'mystery' : 'regular'];

  // Event handlers
  const handleRevealMystery = () => {
    if (!canReveal || revealMutation.isPending) return;
    revealMutation.mutate();
  };

  const handleDuplicate = async () => {
    try {
      const body = convertOrderToUpsertBody(order);
      await upsertOrder.mutateAsync({
        groupOrderId: orderId,
        body,
      });
      onDuplicate?.();
      onOrderChange?.();
    } catch {
      // Silently fail
    }
  };

  // Determine which items to display
  const displayOrder = hasRevealedItems ? { ...order, items: revealedItems! } : order;
  const {
    meats: meatsList,
    sauces: saucesList,
    garnitures: garnituresList,
    extras: extrasList,
    drinks: drinksList,
    desserts: dessertsList,
  } = extractOrderItems(displayOrder);

  const itemCount = (taco ? 1 : 0) + extrasList.length + drinksList.length + dessertsList.length;
  const tacoConfig = taco ? TACO_SIZE_CONFIG[taco.size] : undefined;
  const userName = order.name ?? t('orders.detail.list.unknownUser');

  // Generate fake badges for mystery tacos
  const fakeBadges = !isMystery || hasRevealedItems || !taco ? null : generateFakeBadges(taco.id);

  return (
    <Card className={cardClassName}>
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
            className={isMystery ? 'bg-linear-to-br from-purple-500 to-indigo-500' : undefined}
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
            <p className={cn('font-bold text-sm leading-tight', titleColor)}>
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
            <FakeBadges
              meats={fakeBadges?.meats ?? []}
              sauces={fakeBadges?.sauces ?? []}
              garnitures={fakeBadges?.garnitures ?? []}
              extrasList={extrasList}
              drinksList={drinksList}
              dessertsList={dessertsList}
              t={t}
              taco={taco}
            />
          ) : (
            <div
              className={cn(
                'space-y-2 transition-all duration-700 ease-in-out',
                hasRevealedItems && 'fade-in slide-in-from-bottom-2 animate-in'
              )}
            >
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

        <RevealButton
          canReveal={canReveal}
          hasRevealedItems={hasRevealedItems}
          isPending={isPending}
          isSubmitting={isSubmitting}
          revealMutation={revealMutation}
          onReveal={handleRevealMystery}
          t={t}
        />

        <div
          className={cn(
            'mt-auto flex items-center justify-between border-t pt-3',
            footerBorderColor
          )}
        >
          <div className={cn('font-semibold text-xs uppercase tracking-wide', footerTextColor)}>
            {t('orders.detail.list.itemCount', { count: itemCount })}
          </div>
          <div className="text-right">
            <p className={cn('font-bold text-xl leading-none', priceColor)}>
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
