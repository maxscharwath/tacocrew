/**
 * Loader factory utilities for creating type-safe loaders with consistent patterns
 * @module lib/utils/loader-factory
 */

import type { LoaderFunctionArgs } from 'react-router';
import { defer } from './defer';
import { requireSession, withAuthErrorHandling } from './loader-helpers';

type LoaderHandler<T> = (args: LoaderFunctionArgs) => Promise<T>;

type LoaderOptions = {
  /** Require authentication before executing loader */
  readonly requireAuth?: boolean;
};

/**
 * Create a type-safe loader function that automatically wraps the result in Response.json()
 *
 * @template T - The data type returned by the loader handler
 * @param handler - Async function that returns the loader data
 * @param options - Optional configuration for auth requirements
 * @returns Loader function that returns Response with JSON data
 *
 * @example
 * ```typescript
 * export const profileLoader = createLoader(async ({ params }) => {
 *   const profile = await UserApi.getProfile();
 *   return { profile };
 * }, { requireAuth: true });
 *
 * type LoaderData = LoaderData<typeof profileLoader>;
 * ```
 */
export function createLoader<T extends Record<string, unknown>>(
  handler: LoaderHandler<T>,
  options: LoaderOptions = {}
): (args: LoaderFunctionArgs) => Promise<Response> {
  return async (args: LoaderFunctionArgs): Promise<Response> => {
    // Require authentication if specified
    if (options.requireAuth) {
      await requireSession(args.request);
    }

    // Execute handler with auth error handling
    const data = await withAuthErrorHandling(() => handler(args), args.request);

    // Return JSON response
    return Response.json(data);
  };
}

/**
 * Create a loader function that returns deferred data for Suspense/Await pattern
 *
 * @template T - The data type returned by the loader handler
 * @param handler - Async function that returns the loader data
 * @param options - Optional configuration for auth requirements
 * @returns Loader function that returns Response with deferred data
 *
 * @example
 * ```typescript
 * export const dashboardLoader = createDeferredLoader(async () => {
 *   const data = await loadDashboard();
 *   return { data };
 * }, { requireAuth: true });
 *
 * // In component:
 * const { data } = useLoaderData<LoaderData>();
 * <DeferredRoute data={data} fallback={<Skeleton />}>
 *   {(resolved) => <Content data={resolved} />}
 * </DeferredRoute>
 * ```
 */
export function createDeferredLoader<T extends Record<string, unknown>>(
  handler: LoaderHandler<T>,
  options: LoaderOptions = {}
) {
  return async (args: LoaderFunctionArgs) => {
    // Require authentication if specified
    if (options.requireAuth) {
      await requireSession(args.request);
    }

    // Create deferred data object
    const data = withAuthErrorHandling(() => handler(args), args.request);

    // Return deferred response (React Router handles plain objects with Promises)
    return defer({ data });
  };
}
