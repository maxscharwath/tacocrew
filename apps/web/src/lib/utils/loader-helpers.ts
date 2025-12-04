/**
 * Loader helper utilities
 * @module lib/utils/loader-helpers
 */

import { redirect } from 'react-router';
import { ApiError } from '@/lib/api/http';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/lib/routes';
import { sessionStore } from '@/lib/session/store';

/**
 * Check if user has a valid session, redirect to login if not
 * @throws {Response} Redirects to login page if no session
 */
export async function requireSession(request?: Request): Promise<{ userId: string }> {
  const session = await authClient.getSession();
  if (!session?.data?.user) {
    sessionStore.clearSession();
    // Preserve the current URL as redirect parameter
    const currentUrl = request
      ? new URL(request.url).pathname + new URL(request.url).search
      : undefined;
    const redirectUrl = currentUrl
      ? routes.signin({ search: { redirect: currentUrl } })
      : routes.signin();
    throw redirect(redirectUrl);
  }
  return { userId: session.data.user.id };
}

/**
 * Wrap an API call with 401 error handling
 * If the API returns 401, redirects to login
 * @param apiCall - The API call to wrap
 * @param request - Optional request object to preserve redirect URL
 * @returns The result of the API call
 * @throws {Response} Redirects to login page on 401
 */
export async function withAuthErrorHandling<T>(
  apiCall: () => Promise<T>,
  request?: Request
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      sessionStore.clearSession();
      // Preserve the current URL as redirect parameter
      const currentUrl = request
        ? new URL(request.url).pathname + new URL(request.url).search
        : undefined;
      const redirectUrl = currentUrl
        ? routes.signin({ search: { redirect: currentUrl } })
        : routes.signin();
      throw redirect(redirectUrl);
    }
    throw error;
  }
}

/**
 * Create a deferred promise with 401 error handling
 * @param apiCall - The API call to wrap
 * @returns A promise that handles 401 errors
 */
export function createDeferredWithAuth<T>(apiCall: () => Promise<T>): Promise<T> {
  return withAuthErrorHandling(apiCall);
}

/**
 * Check if the current route is the login page
 */
export function isLoginRoute(request: Request): boolean {
  const url = new URL(request.url);
  return url.pathname === routes.signin() || url.pathname === routes.signup();
}
