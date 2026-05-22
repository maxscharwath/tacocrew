/**
 * Order creation data loading hook.
 *
 * Combines the four react-query reads the order-creation screen needs into a
 * single state. Loading and error fields come straight from react-query; the
 * only added value is the `editingOrderMissing` flag which the route uses to
 * 404 cleanly when an edit target no longer exists.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useGroupOrderWithOrders, usePreviousOrders, useStock, useUserOrder } from '@/lib/api';
import type { UserOrderDetail } from '@/lib/api/orders';
import type { GroupOrderWithUserOrders, PreviousOrder, StockResponse } from '@/lib/api/types';
import { routes } from '@/lib/routes';

export interface OrderCreationDataState {
  group: GroupOrderWithUserOrders | undefined;
  stock: StockResponse | undefined;
  previousOrders: PreviousOrder[];
  editingOrder: UserOrderDetail | null;
  isLoading: boolean;
  error: Error | null;
  editingOrderMissing: boolean;
  refetch: () => void;
}

export function useOrderCreationData(
  groupOrderId: string,
  editOrderId?: string | null
): OrderCreationDataState {
  const navigate = useNavigate();

  const groupQuery = useGroupOrderWithOrders(groupOrderId);
  const stockQuery = useStock();
  const previousOrdersQuery = usePreviousOrders();
  const editingOrderQuery = useUserOrder(groupOrderId, editOrderId ?? '', !!editOrderId);

  const editingOrderMissing = !!editOrderId && !!editingOrderQuery.error;

  // Stale edit target → drop the orderId from the URL and stay on /create.
  useEffect(() => {
    if (editingOrderMissing) {
      navigate(routes.root.orderCreate({ orderId: groupOrderId }), { replace: true });
    }
  }, [editingOrderMissing, groupOrderId, navigate]);

  const isLoading =
    groupQuery.isPending ||
    stockQuery.isPending ||
    previousOrdersQuery.isPending ||
    (!!editOrderId && editingOrderQuery.isPending);

  const error =
    groupQuery.error ??
    stockQuery.error ??
    previousOrdersQuery.error ??
    (editOrderId ? editingOrderQuery.error : null);

  return {
    group: groupQuery.data,
    stock: stockQuery.data,
    previousOrders: previousOrdersQuery.data ?? [],
    editingOrder: editingOrderQuery.data ?? null,
    isLoading,
    error,
    editingOrderMissing,
    refetch: () => {
      void groupQuery.refetch();
      void stockQuery.refetch();
      void previousOrdersQuery.refetch();
      if (editOrderId) void editingOrderQuery.refetch();
    },
  };
}
