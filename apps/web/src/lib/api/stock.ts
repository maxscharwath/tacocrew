import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
import type { StockResponse } from '@/lib/api/types';
export function getStock() {
  return apiClient.get<StockResponse>('/api/v1/stock', { skipAuth: true });
}

export function useStock(enabled = true) {
  return useQuery<StockResponse>({
    queryKey: ['stock'],
    queryFn: () => getStock(),
    enabled,
  });
}
