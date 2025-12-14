import { Avatar, AvatarFallback, Button } from '@tacocrew/ui-kit';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PreviousOrder, StockResponse, TacoOrder } from '@/lib/api/types';
import { PreviousTacosModal } from './PreviousTacosModal';
import { TacoHashSearch } from './TacoHashSearch';

type PreviousTacosProps = {
  readonly previousOrders: PreviousOrder[];
  readonly stock: StockResponse;
  readonly onSelectTaco: (taco: PreviousOrder['taco'] | TacoOrder) => void;
  readonly disabled?: boolean;
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
    onSelectTaco(taco);
    setIsModalOpen(false);
    setTimeout(() => {
      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <>
      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:space-y-6 sm:rounded-3xl sm:p-6">
        <div className="flex items-center gap-2 border-white/10 border-b pb-3 sm:gap-3 sm:pb-4">
          <Avatar color="indigo" size="sm" className="sm:size-md">
            <AvatarFallback>
              <Package />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-base text-white sm:text-lg">
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
            className="w-full gap-1.5 text-xs sm:gap-2 sm:text-sm"
          >
            <Package size={14} className="sm:w-4" />
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
