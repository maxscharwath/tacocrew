import { Modal } from '@tacocrew/ui-kit';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrderInjectionPreview } from '@/lib/api/orders';
import type { OrderPreview, OrderPreviewItem } from '@/lib/api/types';
import { CommandeInjectionCard } from './CommandeInjectionCard';

type CommandeInjectionModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  groupOrderId: string;
}>;

export function CommandeInjectionModal({
  isOpen,
  onClose,
  groupOrderId,
}: CommandeInjectionModalProps) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useOrderInjectionPreview(groupOrderId, isOpen);

  const orderPreview = useMemo<OrderPreview | null>(() => {
    if (!data) return null;
    const items: OrderPreviewItem[] = data.items.map((item) => ({
      productId: item.productId,
      ...(item.productName !== undefined && { productName: item.productName }),
      productImage: item.productImage ?? null,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      price: item.price,
      options: item.options,
      note: item.note ?? null,
      ...(item.combo !== undefined && { combo: item.combo }),
    }));
    return {
      restaurantId: data.restaurantId,
      serviceType: 'pickup',
      items,
      total: 0,
      customerName: '',
      customerPhone: '',
      guestDeliveryAddress: null,
      paymentMethod: 'twint',
      isPreorder: false,
      dineIn: false,
      isOnSite: false,
      deliveryFee: 0,
    };
  }, [data]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('orders.injection.modal.title')}
      description={t('orders.injection.modal.description')}
    >
      {isLoading && (
        <p className="text-slate-400 text-sm">{t('orders.injection.modal.loading')}</p>
      )}
      {error && (
        <p className="text-red-400 text-sm">
          {error instanceof Error ? error.message : t('orders.injection.modal.error')}
        </p>
      )}
      {orderPreview && (
        <CommandeInjectionCard
          orderPreview={orderPreview}
          restaurantId={orderPreview.restaurantId}
        />
      )}
    </Modal>
  );
}
