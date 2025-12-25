/**
 * Root loader utilities
 * Helper functions for root loader data preloading
 */

import type { LoaderFunctionArgs } from 'react-router';
import { getProfile } from '@/lib/api/user';
import { isLoginRoute, withAuthErrorHandling } from '@/lib/utils/loader-helpers';
import type { RootLoaderData } from '@/routes/root.loader';

/**
 * Load profile data for authenticated users
 * Returns null if on login route, otherwise fetches and validates profile
 */
export async function loadRootLoaderData(request: Request): Promise<RootLoaderData> {
  // Skip profile fetch on login routes
  if (isLoginRoute(request)) {
    return { profile: null };
  }

  // Fetch and validate profile, with auth error handling
  const profile = await withAuthErrorHandling(() => getProfile(), request);
  return { profile };
}

/**
 * Create root loader response
 */
export function createRootLoaderResponse(data: RootLoaderData): Response {
  return Response.json(data);
}

/**
 * Create root loader function with proper error handling
 */
export function createRootLoader() {
  return async ({ request }: LoaderFunctionArgs): Promise<Response> => {
    const data = await loadRootLoaderData(request);
    return createRootLoaderResponse(data);
  };
}
