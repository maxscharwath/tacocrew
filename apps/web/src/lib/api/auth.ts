import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
import type { LoginRequestBody, LoginResponse } from '@/lib/api/types';
import { userKeys } from '@/lib/api/user';

/** Internal query key factory */
const authKeys = {
  all: () => ['auth'] as const,
  login: () => [...authKeys.all(), 'login'] as const,
};

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequestBody) =>
      apiClient.post<LoginResponse>('/api/auth', {
        body,
        skipAuth: true,
      }),
    onSuccess: () => {
      // After login, invalidate all user-related queries to ensure fresh data
      void queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
}
