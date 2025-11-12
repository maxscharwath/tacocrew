import { Package } from '@untitledui/icons/Package';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import type { PreviousOrder, StockResponse, TacoOrder } from '@/lib/api/types';
import { PreviousTacosModal } from './PreviousTacosModal';
import { TacoHashSearch } from './TacoHashSearch';

type PreviousTacosProps = {
  previousOrders: PreviousOrder[];
  stock: StockResponse;
  onSelectTaco: (taco: PreviousOrder['taco'] | TacoOrder) => void;
  disabled?: boolean;
};

export function PreviousTacos({
  previousOrders,
  stock,
  onSelectTaco,
  disabled,
}: PreviousTacosProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (taco: PreviousOrder['taco'] | TacoOrder) => {
    if (disabled) return;
    // Only prefills the form - does NOT validate or submit automatically
    // User must manually review and click submit to place the order
    onSelectTaco(taco);
    setIsModalOpen(false);
    // Scroll to the form section after a brief delay to show the prefilled form
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <>
      <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6">
        <div className="flex items-center gap-3 border-white/10 border-b pb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-purple-400/30 bg-linear-to-br from-purple-400/20 to-violet-500/20">
            <Package size={20} className="text-purple-300" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-white">
              {t('orders.create.previousTacos.title')}
            </h2>
            <p className="text-slate-400 text-xs">{t('orders.create.previousTacos.description')}</p>
          </div>
        </div>

        {/* tacoID Search Section */}
        <TacoHashSearch onSelectTaco={handleSelect} disabled={disabled} />

        {/* Favorites Button - only show if there are previous orders */}
        {previousOrders.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            disabled={disabled}
            className="w-full gap-2"
          >
            <Package size={16} />
            {t('orders.create.previousTacos.openModal')}
          </Button>
        )}
      </div>

      <PreviousTacosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        previousOrders={previousOrders}
        stock={stock}
        disabled={disabled}
        onSelectTaco={handleSelect}
      />
    </>
  );
}
