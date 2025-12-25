import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
import type { LoginRequestBody, LoginResponse } from '@/lib/api/types';

/** Internal query key factory */
const authKeys = {
  all: () => ['auth'] as const,
  login: () => [...authKeys.all(), 'login'] as const,
};

export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginRequestBody) =>
      apiClient.post<LoginResponse>('/api/auth', {
        body,
        skipAuth: true,
      }),
  });
}
