import { apiClient } from './http';
import type { LoginRequestBody, LoginResponse } from './types';

export function login(body: LoginRequestBody) {
  return apiClient.post<LoginResponse>('/auth', {
    body,
    skipAuth: true,
  });
}
