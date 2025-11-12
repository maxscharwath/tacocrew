import { Plus } from '@untitledui/icons/Plus';
import { ShoppingBag01 } from '@untitledui/icons/ShoppingBag01';
import { useTranslation } from 'react-i18next';
import { SelectionGroup } from '@/components/orders';
import { Card, CardContent } from '@/components/ui';
import type { StockResponse } from '@/lib/api/types';

type ExtrasSectionProps = {
  stock: StockResponse;
  extras: string[];
  drinks: string[];
  desserts: string[];
  onToggleExtra: (id: string) => void;
  onToggleDrink: (id: string) => void;
  onToggleDessert: (id: string) => void;
};

export function ExtrasSection({
  stock,
  extras,
  drinks,
  desserts,
  onToggleExtra,
  onToggleDrink,
  onToggleDessert,
}: ExtrasSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <div className="flex items-center gap-3 border-white/10 border-b pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/30 bg-linear-to-br from-violet-400/20 to-purple-500/20">
          <ShoppingBag01 size={20} className="text-violet-300" />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-white">
            {t('orders.create.extrasSection.title')}
          </h2>
          <p className="text-slate-400 text-xs">{t('orders.create.extrasSection.subtitle')}</p>
        </div>
      </div>

      <Card className="border-white/10 bg-slate-800/30">
        <CardContent className="space-y-6 p-6">
          <SelectionGroup
            title={t('common.labels.extras')}
            items={stock.extras}
            selected={extras}
            onToggle={onToggleExtra}
            icon={Plus}
          />
          {extras.map((id) => (
            <input key={id} type="hidden" name="extras" value={id} />
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-800/30">
        <CardContent className="space-y-6 p-6">
          <SelectionGroup
            title={t('common.labels.drinks')}
            items={stock.drinks}
            selected={drinks}
            onToggle={onToggleDrink}
            icon={Plus}
          />
          {drinks.map((id) => (
            <input key={id} type="hidden" name="drinks" value={id} />
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-800/30">
        <CardContent className="space-y-6 p-6">
          <SelectionGroup
            title={t('common.labels.desserts')}
            items={stock.desserts}
            selected={desserts}
            onToggle={onToggleDessert}
            icon={Plus}
          />
          {desserts.map((id) => (
            <input key={id} type="hidden" name="desserts" value={id} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
