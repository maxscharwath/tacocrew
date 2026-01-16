import { redirect } from 'react-router';
import { ApiError } from '@/lib/api/http';
import { routes } from '@/lib/routes';

function getRedirectUrl(request?: Request): string {
  if (!request) return routes.signin();
  const { pathname, search } = new URL(request.url);
  return routes.signin({ search: { redirect: pathname + search } });
}

export async function withAuthErrorHandling<T>(
  apiCall: () => Promise<T>,
  request?: Request
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      throw redirect(getRedirectUrl(request));
    }
    throw error;
  }
}

export function createDeferredWithAuth<T>(apiCall: () => Promise<T>): Promise<T> {
  return withAuthErrorHandling(apiCall);
}

export function isLoginRoute(request: Request): boolean {
  const { pathname } = new URL(request.url);
  return pathname === routes.signin() || pathname === routes.signup();
}
