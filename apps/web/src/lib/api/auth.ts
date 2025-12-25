import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
import type { LoginRequestBody, LoginResponse } from '@/lib/api/types';

function login(body: LoginRequestBody) {
  return apiClient.post<LoginResponse>('/api/auth', {
    body,
    skipAuth: true,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginRequestBody) => login(body),
  });
}
