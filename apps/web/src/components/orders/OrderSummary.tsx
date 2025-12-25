import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tacocrew/ui-kit';
import { Dices, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StockResponse } from '@/lib/api';
import { TacoKind } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import type { MeatSelection, PriceBreakdownItem, ProgressStep, TacoSizeItem } from '@/types/orders';
import { ProgressStepper } from './ProgressStepper';

/**
 * OrderSummary - Sidebar preview component for order creation
 * @component
 */

type OrderSummaryProps = Readonly<{
  selectedTacoSize: TacoSizeItem | null;
  meats: MeatSelection[];
  sauces: string[];
  garnitures: string[];
  extras: string[];
  drinks: string[];
  desserts: string[];
  note: string;
  priceBreakdown: PriceBreakdownItem[];
  totalPrice: number;
  currency: string;
  summaryBreakdown: string;
  hasTaco: boolean;
  hasOtherItems: boolean;
  canSubmit: boolean;
  validationMessages: string[];
  stock: StockResponse;
  progressSteps: ProgressStep[];
  formId: string;
  isSubmitting: boolean;
  editOrderId: string | null;
  kind?: TacoKind;
  onCancel: () => void;
}>;

export function OrderSummary({
  selectedTacoSize,
  meats,
  sauces,
  garnitures,
  extras: _extras, // Used for hasOtherItems calculation in parent
  drinks: _drinks, // Used for hasOtherItems calculation in parent
  desserts: _desserts, // Used for hasOtherItems calculation in parent
  note,
  priceBreakdown,
  totalPrice,
  currency,
  summaryBreakdown,
  hasTaco,
  hasOtherItems,
  canSubmit,
  validationMessages,
  stock,
  progressSteps,
  formId,
  isSubmitting,
  editOrderId,
  kind,
  onCancel,
}: OrderSummaryProps) {
  const { t } = useTranslation();
  const isMystery = kind === TacoKind.MYSTERY;

  return (
    <Card className="flex h-full max-h-[calc(100vh-4rem)] flex-col border-brand-400/30 bg-linear-to-br from-brand-500/10 via-slate-900/80 to-slate-950/90 shadow-[0_30px_90px_rgba(8,47,73,0.35)]">
      <CardHeader className="gap-3 border-white/10 border-b">
        <div className="flex items-center gap-3">
          <Avatar color="brand" size="md">
            <AvatarFallback>
              <ShoppingBag />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-white">{t('orders.create.summary.title')}</CardTitle>
            <CardDescription className="mt-0.5">
              {t('orders.create.summary.subtitle')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Progress Stepper (only show if taco is selected) */}
        {progressSteps.length > 0 && (
          <div className="mt-6">
            <ProgressStepper steps={progressSteps} />
          </div>
        )}
        {/* Scrollable content area */}
        <div className="-mr-2 max-h-full min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
          {hasTaco || hasOtherItems ? (
            <div className="space-y-3">
              {selectedTacoSize && (
                <div
                  className={cn(
                    'rounded-xl border p-4',
                    isMystery
                      ? 'border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-slate-900/50'
                      : 'border-white/10 bg-slate-900/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isMystery && <Dices className="h-4 w-4 text-purple-400" />}
                        <p className="truncate font-semibold text-sm text-white">
                          {isMystery
                            ? t('orders.create.mystery.summaryTitle')
                            : selectedTacoSize.name}
                        </p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                        {isMystery ? (
                          <span className="rounded-full bg-purple-800/60 px-2 py-0.5 text-purple-200">
                            {t('orders.create.mystery.summaryMeats')}
                          </span>
                        ) : (
                          meats.length > 0 && (
                            <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-300">
                              {t('orders.create.summary.tags.meats', {
                                count: meats.reduce((sum, m) => sum + m.quantity, 0),
                              })}
                            </span>
                          )
                        )}
                        {sauces.length > 0 && (
                          <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-300">
                            {t('orders.create.summary.tags.sauces', { count: sauces.length })}
                          </span>
                        )}
                        {garnitures.length > 0 && (
                          <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-300">
                            {t('orders.create.summary.tags.garnishes', {
                              count: garnitures.length,
                            })}
                          </span>
                        )}
                      </div>
                      {!isMystery && meats.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {meats.map((meat) => {
                            const meatItem = stock.meats.find((m) => m.id === meat.id);
                            return (
                              <div key={meat.id} className="text-slate-400 text-xs">
                                {meat.quantity}x {meatItem?.name ?? meat.id}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <p
                      className={cn(
                        'shrink-0 font-semibold text-sm',
                        isMystery ? 'text-purple-200' : 'text-brand-100'
                      )}
                    >
                      {selectedTacoSize.price.value.toFixed(2)} {selectedTacoSize.price.currency}
                    </p>
                  </div>
                  {note.trim() && (
                    <div className="mt-3 border-white/10 border-t pt-3">
                      <p className="mb-1 font-semibold text-amber-300 text-xs uppercase tracking-[0.2em]">
                        {t('orders.create.summary.specialInstructions')}
                      </p>
                      <p className="text-amber-100 text-xs">{note.trim()}</p>
                    </div>
                  )}
                </div>
              )}

              {priceBreakdown.length > (selectedTacoSize ? 1 : 0) && (
                <div
                  className={cn('space-y-2', selectedTacoSize && 'border-white/10 border-t pt-2')}
                >
                  {priceBreakdown.slice(selectedTacoSize ? 1 : 0).map((item, idx) => (
                    <div
                      key={`price-item-${item.label}-${idx}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-medium text-slate-300">
                        {item.price.toFixed(2)} {currency}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/15 border-dashed bg-slate-900/30 p-8 text-center">
              <p className="text-slate-400 text-sm">{t('orders.create.summary.emptyState')}</p>
            </div>
          )}
        </div>

        {/* Fixed total price section - always visible */}
        <div className="shrink-0 border-white/10 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-white">
              {t('orders.create.summary.totalLabel')}
            </span>
            <span className="font-bold text-2xl text-brand-100">
              {totalPrice.toFixed(2)} {currency}
            </span>
          </div>
          <p className="mt-2 text-slate-400 text-xs">{summaryBreakdown}</p>
        </div>

        {/* Fixed validation message - always visible */}
        {!canSubmit && (
          <div className="mt-4 shrink-0 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
            <p className="text-amber-200 text-xs">{validationMessages.join(' ')}</p>
          </div>
        )}

        {/* Submit button - fixed at bottom */}
        <div className="mt-6 shrink-0 space-y-3 border-white/10 border-t pt-4">
          <Button
            type="submit"
            form={formId}
            loading={isSubmitting}
            disabled={!canSubmit || isSubmitting}
            fullWidth
            className="w-full"
          >
            {editOrderId ? t('orders.create.actions.update') : t('orders.create.actions.save')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            fullWidth
            className="w-full"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
