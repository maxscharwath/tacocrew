import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
import type { TacoOrder } from '@/lib/api/types';

/** Internal query key factory for tacos */
const tacosKeys = {
  all: () => ['tacos'] as const,
  detail: (tacoID: string) => [...tacosKeys.all(), tacoID] as const,
} as const;

export function useGetTacoByTacoID() {
  return useMutation({
    mutationFn: (tacoID: string) =>
      apiClient.get<TacoOrder>(`/api/v1/tacos/${tacoID}`, { skipAuth: true }),
  });
}
