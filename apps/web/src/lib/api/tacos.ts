import { apiClient } from './http';
import type { TacoOrder } from './types';

export function getTacoByTacoID(tacoID: string) {
  return apiClient.get<TacoOrder>(`/api/v1/tacos/${tacoID}`, { skipAuth: true });
}
