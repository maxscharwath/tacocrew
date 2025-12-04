import { apiClient } from '@/lib/api/http';
import type { LoginRequestBody, LoginResponse } from '@/lib/api/types';

export function login(body: LoginRequestBody) {
  return apiClient.post<LoginResponse>('/api/auth', {
    body,
    skipAuth: true,
  });
}
