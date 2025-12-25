/**
 * Order creation data loading hook
 * Handles all async data fetching for the order creation flow
 * Returns Result type for functional error handling
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getUserOrder, useGroupOrderWithOrders, usePreviousOrders, useStock } from '@/lib/api';
import type { UserOrderDetail } from '@/lib/api/orders';
import type { GroupOrderWithUserOrders, PreviousOrder, StockResponse } from '@/lib/api/types';
import { routes } from '@/lib/routes';
import { type OrderError, OrderErrorFactory } from '@/lib/types/order-error';
import type { Result } from '@/lib/types/result';
import { Err, Ok } from '@/lib/types/result';

export interface OrderCreationData {
  group: GroupOrderWithUserOrders;
  stock: StockResponse;
  previousOrders: PreviousOrder[];
  editingOrder: UserOrderDetail | null;
}

export interface OrderCreationDataState {
  result: Result<OrderCreationData, OrderError>;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Load all data needed for order creation
 * Returns Result type for type-safe error handling
 */
export function useOrderCreationData(
  groupOrderId: string,
  editOrderId?: string | null
): OrderCreationDataState {
  const navigate = useNavigate();
  const [editingOrder, setEditingOrder] = useState<UserOrderDetail | null>(null);
  const [editingOrderError, setEditingOrderError] = useState<OrderError | null>(null);

  // Queries
  const groupQuery = useGroupOrderWithOrders(groupOrderId);
  const stockQuery = useStock();
  const previousOrdersQuery = usePreviousOrders();

  // Fetch editing order if provided
  useEffect(() => {
    if (editOrderId) {
      setEditingOrderError(null);
      getUserOrder(groupOrderId, editOrderId)
        .then(setEditingOrder)
        .catch((error) => {
          const orderError = OrderErrorFactory.userOrderNotFound(editOrderId);
          setEditingOrderError(orderError);
          // Redirect if order not found
          navigate(routes.root.orderCreate({ orderId: groupOrderId }), { replace: true });
        });
    } else {
      setEditingOrder(null);
      setEditingOrderError(null);
    }
  }, [editOrderId, groupOrderId, navigate]);

  const isLoading = groupQuery.isPending || stockQuery.isPending || previousOrdersQuery.isPending;

  // Build result from all queries
  const result: Result<OrderCreationData, OrderError> = (() => {
    // Check for any errors
    if (groupQuery.error) {
      return Err(OrderErrorFactory.groupLoadFailed(groupQuery.error as Error));
    }
    if (stockQuery.error) {
      return Err(OrderErrorFactory.stockLoadFailed(stockQuery.error as Error));
    }
    if (previousOrdersQuery.error) {
      return Err(OrderErrorFactory.ordersLoadFailed(previousOrdersQuery.error as Error));
    }
    if (editingOrderError) {
      return Err(editingOrderError);
    }

    // Check if all required data is loaded
    if (!groupQuery.data || !stockQuery.data || previousOrdersQuery.data === undefined) {
      // Still loading
      return Err(OrderErrorFactory.unknown(new Error('Data not yet loaded')));
    }

    // All data loaded successfully
    return Ok({
      group: groupQuery.data,
      stock: stockQuery.data,
      previousOrders: previousOrdersQuery.data ?? [],
      editingOrder,
    });
  })();

  return {
    result,
    isLoading,
    refetch: () => {
      groupQuery.refetch();
      stockQuery.refetch();
      previousOrdersQuery.refetch();
    },
  };
}
