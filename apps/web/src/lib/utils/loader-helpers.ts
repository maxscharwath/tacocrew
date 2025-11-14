/**
 * Loader helper utilities
 * @module lib/utils/loader-helpers
 */

import { redirect } from 'react-router';
import { ApiError } from '../api/http';
import { authClient } from '../auth-client';
import { routes } from '../routes';
import { sessionStore } from '../session/store';

/**
 * Check if user has a valid session, redirect to login if not
 * @throws {Response} Redirects to login page if no session
 */
export async function requireSession(): Promise<{ userId: string }> {
  const session = await authClient.getSession();
  if (!session?.data?.user) {
    sessionStore.clearSession();
    throw redirect(routes.signin());
  }
  return { userId: session.data.user.id };
}

/**
 * Wrap an API call with 401 error handling
 * If the API returns 401, redirects to login
 * @param apiCall - The API call to wrap
 * @returns The result of the API call
 * @throws {Response} Redirects to login page on 401
 */
export async function withAuthErrorHandling<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      sessionStore.clearSession();
      throw redirect(routes.signin());
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
