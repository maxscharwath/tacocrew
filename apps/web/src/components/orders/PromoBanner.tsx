import { Card } from '@tacocrew/ui-kit';
import { Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AppliedPromo } from '@/lib/promos';

interface PromoBannerProps {
  /** Applied promos for the current order (output of `findApplicablePromos`). */
  readonly appliedPromos: ReadonlyArray<AppliedPromo>;
  /** Resolved item names for each free line id — keyed by stock-item id. */
  readonly itemNamesById: ReadonlyMap<string, string>;
}

export function PromoBanner({ appliedPromos, itemNamesById }: PromoBannerProps) {
  const { t } = useTranslation();
  if (appliedPromos.length === 0) return null;

  return (
    <div className="space-y-3">
      {appliedPromos.map((applied) => {
        const promo = applied.promo;
        const totalSlots = promo.reward.quantity;
        const freeLineIds = [...applied.freeUnitsByLineId.keys()];
        const claimed = freeLineIds.length;
        const remaining = applied.remainingSlots;
        const claimedNames = freeLineIds
          .map((id) => itemNamesById.get(id))
          .filter((n): n is string => Boolean(n));

        return (
          <Card
            key={promo.id}
            className="border-amber-400/40 bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-amber-400 to-rose-500">
                <Gift size={20} className="text-white" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-amber-50 text-sm">
                  {t('orders.create.promo.title', {
                    count: totalSlots,
                    name: promo.name,
                  })}
                </p>
                {claimed === 0 ? (
                  <p className="text-amber-100/80 text-sm">{t('orders.create.promo.cta')}</p>
                ) : (
                  <p className="text-amber-100/90 text-sm">
                    {t('orders.create.promo.bundled', {
                      names: claimedNames.join(', '),
                    })}
                    {remaining > 0 && (
                      <>
                        {' '}
                        <span className="text-amber-200/80">
                          {t('orders.create.promo.pickMore', { count: remaining })}
                        </span>
                      </>
                    )}
                  </p>
                )}
                {applied.savings > 0 && (
                  <p className="text-amber-200/70 text-xs">
                    {t('orders.create.promo.savings', { amount: applied.savings.toFixed(2) })}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
