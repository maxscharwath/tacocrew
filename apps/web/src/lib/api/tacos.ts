import { apiClient } from '@/lib/api/http';
import type { TacoOrder } from '@/lib/api/types';

export function getTacoByTacoID(tacoID: string) {
  return apiClient.get<TacoOrder>(`/api/v1/tacos/${tacoID}`, { skipAuth: true });
}
