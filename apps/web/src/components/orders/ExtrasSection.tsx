import { CakeSlice, CupSoda, Package, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SelectionGroup } from '@/components/orders';
import { Avatar, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { StockResponse } from '@/lib/api/types';

type ExtrasSectionProps = {
  readonly stock: StockResponse;
  readonly extras: string[];
  readonly drinks: string[];
  readonly desserts: string[];
  readonly onToggleExtra: (id: string) => void;
  readonly onToggleDrink: (id: string) => void;
  readonly onToggleDessert: (id: string) => void;
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
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:space-y-6 sm:rounded-3xl sm:p-6">
      <div className="flex items-center gap-2 border-white/10 border-b pb-3 sm:gap-3 sm:pb-4">
        <Avatar color="emerald" size="sm" className="sm:size-md">
          <ShoppingBag />
        </Avatar>
        <div>
          <h2 className="font-semibold text-base text-white sm:text-lg">
            {t('orders.create.extrasSection.title')}
          </h2>
          <p className="text-slate-400 text-xs">{t('orders.create.extrasSection.subtitle')}</p>
        </div>
      </div>

      {[
        {
          icon: Package,
          label: t('common.labels.extras'),
          items: stock.extras,
          selected: extras,
          onToggle: onToggleExtra,
          name: 'extras',
        },
        {
          icon: CupSoda,
          label: t('common.labels.drinks'),
          items: stock.drinks,
          selected: drinks,
          onToggle: onToggleDrink,
          name: 'drinks',
        },
        {
          icon: CakeSlice,
          label: t('common.labels.desserts'),
          items: stock.desserts,
          selected: desserts,
          onToggle: onToggleDessert,
          name: 'desserts',
        },
      ].map(({ icon: Icon, label, items, selected, onToggle, name }) => (
        <Card key={name} className="border-white/10 bg-slate-800/30">
          <CardHeader className="gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Icon size={16} className="text-brand-400 sm:w-4.5" />
              <CardTitle className="text-white text-xs normal-case tracking-normal sm:text-sm">
                {label}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <SelectionGroup items={items} selected={selected} onToggle={onToggle} />
            {selected.map((id) => (
              <input key={id} type="hidden" name={name} value={id} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
