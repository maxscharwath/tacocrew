import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api/http';

/**
 * Props for SectionWrapper component.
 *
 * This component handles the common pattern of:
 * - Show skeleton while loading
 * - Show error message if failed
 * - Show content when successful
 *
 * @example
 * ```tsx
 * <SectionWrapper
 *   query={useGroupOrderWithOrders(id)}
 *   skeleton={<OrderHeroSkeleton />}
 * >
 *   {(data) => <OrderHero data={data} />}
 * </SectionWrapper>
 * ```
 */
export interface SectionWrapperProps<TData> {
  query: UseQueryResult<TData, unknown>;
  skeleton: ReactNode;
  children: (data: TData) => ReactNode;
  errorFallback?: (error: unknown) => ReactNode;
  onError?: (error: unknown) => void;
}

/**
 * Wraps section content with automatic loading/error/data state handling.
 *
 * Eliminates repetitive conditional rendering across components.
 */
export function SectionWrapper<TData>({
  query,
  skeleton,
  children,
  errorFallback,
  onError,
}: SectionWrapperProps<TData>) {
  if (query.isLoading) {
    return <>{skeleton}</>;
  }

  if (query.error) {
    onError?.(query.error);

    // Handle 404 errors by throwing (React Router will catch)
    if (query.error instanceof ApiError && query.error.statusCode === 404) {
      throw new Response('Not found', { status: 404 });
    }

    // Show custom error fallback if provided
    if (errorFallback) {
      return <>{errorFallback(query.error)}</>;
    }

    // Default error state
    return (
      <div className="flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-red-400 text-sm">
          {query.error instanceof Error ? query.error.message : 'Failed to load data'}
        </p>
      </div>
    );
  }

  if (!query.data) {
    return <>{skeleton}</>;
  }

  return <>{children(query.data)}</>;
}
