import { apiClient } from './http';
import type { StockResponse } from './types';

export function getStock() {
  return apiClient.get<StockResponse>('/api/v1/stock', { skipAuth: true });
}
