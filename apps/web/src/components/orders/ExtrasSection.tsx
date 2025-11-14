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
    <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <div className="flex items-center gap-3 border-white/10 border-b pb-4">
        <Avatar color="emerald" size="md">
          <ShoppingBag />
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg text-white">
            {t('orders.create.extrasSection.title')}
          </h2>
          <p className="text-slate-400 text-xs">{t('orders.create.extrasSection.subtitle')}</p>
        </div>
      </div>

      <Card className="border-white/10 bg-slate-800/30">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-brand-400" />
            <CardTitle className="text-sm text-white normal-case tracking-normal">
              {t('common.labels.extras')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <SelectionGroup items={stock.extras} selected={extras} onToggle={onToggleExtra} />
          {extras.map((id) => (
            <input key={id} type="hidden" name="extras" value={id} />
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-800/30">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <CupSoda size={18} className="text-brand-400" />
            <CardTitle className="text-sm text-white normal-case tracking-normal">
              {t('common.labels.drinks')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <SelectionGroup items={stock.drinks} selected={drinks} onToggle={onToggleDrink} />
          {drinks.map((id) => (
            <input key={id} type="hidden" name="drinks" value={id} />
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-800/30">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <CakeSlice size={18} className="text-brand-400" />
            <CardTitle className="text-sm text-white normal-case tracking-normal">
              {t('common.labels.desserts')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <SelectionGroup items={stock.desserts} selected={desserts} onToggle={onToggleDessert} />
          {desserts.map((id) => (
            <input key={id} type="hidden" name="desserts" value={id} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
