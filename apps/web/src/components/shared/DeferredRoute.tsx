/**
 * Reusable Suspense + Await wrapper for deferred loader data
 * @module components/shared/DeferredRoute
 */

import { type ReactElement, type ReactNode, Suspense } from 'react';
import { Await } from 'react-router';

type DeferredRouteProps<T> = Readonly<{
  data: Promise<T>;
  fallback: ReactNode;
  children: (data: T) => ReactNode;
}>;

/**
 * Wrapper component that handles Suspense + Await pattern for deferred data
 *
 * @example
 * ```typescript
 * export function DashboardRoute() {
 *   const { data } = useLoaderData<LoaderData>();
 *   return (
 *     <DeferredRoute data={data} fallback={<DashboardSkeleton />}>
 *       {(resolvedData) => <DashboardContent data={resolvedData} />}
 *     </DeferredRoute>
 *   );
 * }
 * ```
 */
export function DeferredRoute<T>({
  data,
  fallback,
  children,
}: DeferredRouteProps<T>): ReactElement {
  return (
    <Suspense fallback={fallback}>
      <Await resolve={data}>{children}</Await>
    </Suspense>
  );
}
