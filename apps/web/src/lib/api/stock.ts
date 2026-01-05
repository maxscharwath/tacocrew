import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
import type { StockResponse } from '@/lib/api/types';

const stockKeys = {
  all: () => ['stock'] as const,
  stock: () => [...stockKeys.all()] as const,
};

export function useStock(enabled = true) {
  return useQuery<StockResponse>({
    queryKey: stockKeys.stock(),
    queryFn: () => apiClient.get<StockResponse>('/api/v1/stock', { skipAuth: true }),
    enabled,
  });
}

/**
 * Get stock data (server-side only, for use in loaders/actions)
 * NOTE: This raw API function is exported ONLY for use in loaders/actions.
 * Components should use the useStock hook instead.
 */
export async function getStock(): Promise<StockResponse> {
  return apiClient.get<StockResponse>('/api/v1/stock', { skipAuth: true });
}
