import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui';
import type { PreviousOrder, StockResponse } from '@/lib/api/types';
import { PreviousTacoCard } from './PreviousTacoCard';

type PreviousTacosModalProps = {
  isOpen: boolean;
  onClose: () => void;
  previousOrders: PreviousOrder[];
  stock: StockResponse;
  disabled?: boolean;
  onSelectTaco: (taco: PreviousOrder['taco']) => void;
};

export function PreviousTacosModal({
  isOpen,
  onClose,
  previousOrders,
  stock,
  disabled,
  onSelectTaco,
}: PreviousTacosModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('orders.create.previousTacos.title')}
      description={t('orders.create.previousTacos.description')}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {previousOrders.map((order) => (
          <PreviousTacoCard
            key={order.tacoID}
            order={order}
            stock={stock}
            disabled={disabled}
            onSelect={onSelectTaco}
          />
        ))}
      </div>
    </Modal>
  );
}
