import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui';
import type { PreviousOrder, StockResponse } from '@/lib/api/types';
import { PreviousTacoCard } from './PreviousTacoCard';

type PreviousTacosModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly previousOrders: PreviousOrder[];
  readonly stock: StockResponse;
  readonly disabled?: boolean;
  readonly onSelectTaco: (taco: PreviousOrder['taco']) => void;
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
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
