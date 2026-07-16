import { type Query, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
import { isTerminalOrderStatus, type OrderStatus } from '@/lib/order-status';

export interface OrderStatusResponse {
  groupOrderId: string;
  commandeOrderId: string | null;
  status: OrderStatus | null;
  source: 'activePreorders' | 'confirmation' | 'none';
  updatedAt: string | null;
  /** Restaurant's live ETA in minutes, when commande.app provides one. */
  estimatedMinutes: number | null;
  /** Announced pickup/delivery slot start (ISO), when known. */
  pickupTime: string | null;
}

const orderStatusKeys = {
  all: () => ['orderStatus'] as const,
  detail: (groupOrderId: string) => [...orderStatusKeys.all(), groupOrderId] as const,
} as const;

export function fetchOrderStatus(groupOrderId: string): Promise<OrderStatusResponse> {
  return apiClient.get<OrderStatusResponse>(`/api/v1/orders/${groupOrderId}/status`);
}

const DEFAULT_POLL_INTERVAL_MS = 10_000;

interface UseOrderStatusOptions {
  readonly pollIntervalMs?: number;
}

export function useOrderStatus(groupOrderId: string | undefined, opts?: UseOrderStatusOptions) {
  const pollIntervalMs = opts?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  return useQuery<OrderStatusResponse>({
    queryKey: groupOrderId ? orderStatusKeys.detail(groupOrderId) : orderStatusKeys.all(),
    queryFn: () => {
      if (!groupOrderId) {
        // `enabled` guards this path; defensive so types stay clean.
        return Promise.reject(new Error('groupOrderId is required'));
      }
      return fetchOrderStatus(groupOrderId);
    },
    enabled: !!groupOrderId,
    refetchInterval: (query: Query<OrderStatusResponse>) => {
      const current = query.state.data?.status ?? null;
      if (isTerminalOrderStatus(current)) return false;
      return pollIntervalMs;
    },
    refetchIntervalInBackground: false,
  });
}
