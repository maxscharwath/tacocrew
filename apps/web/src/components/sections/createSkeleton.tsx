import { Skeleton } from '@tacocrew/ui-kit';

/**
 * Helper to create consistent skeleton components.
 *
 * @example
 * ```tsx
 * export const OrderHeroSkeleton = createSkeleton({
 *   container: 'space-y-4',
 *   lines: [
 *     { className: 'h-8 w-1/3' },      // Title
 *     { className: 'h-6 w-1/4' },      // Subtitle
 *     { className: 'h-4 w-full' },     // Description line 1
 *     { className: 'h-4 w-3/4' },      // Description line 2
 *   ],
 * });
 * ```
 */

export interface CreateSkeletonConfig {
  container?: string;
  lines: Array<{ className: string; count?: number }>;
}

export function createSkeleton({ container = 'space-y-3', lines }: CreateSkeletonConfig) {
  return function SkeletonComponent() {
    return (
      <div className={container}>
        {lines.map((line, idx) => {
          const count = line.count ?? 1;
          return Array.from({ length: count }).map((_, i) => (
            <Skeleton key={`${idx}-${i}`} className={line.className} />
          ));
        })}
      </div>
    );
  };
}

/**
 * Grid skeleton helper for card-based layouts.
 *
 * @example
 * ```tsx
 * export const OrdersGridSkeleton = createGridSkeleton({
 *   columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
 *   count: 6,
 *   cardHeight: 'h-64',
 * });
 * ```
 */

export interface CreateGridSkeletonConfig {
  columns: string;
  count: number;
  cardHeight: string;
}

export function createGridSkeleton({ columns, count, cardHeight }: CreateGridSkeletonConfig) {
  return function GridSkeletonComponent() {
    return (
      <div className={`grid gap-4 ${columns}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <Skeleton key={idx} className={`rounded-lg ${cardHeight}`} />
        ))}
      </div>
    );
  };
}

/**
 * List skeleton helper for list-based layouts.
 *
 * @example
 * ```tsx
 * export const OrdersListSkeleton = createListSkeleton({
 *   itemCount: 5,
 *   container: 'space-y-3',
 * });
 * ```
 */

export interface CreateListSkeletonConfig {
  itemCount: number;
  container?: string;
  itemHeight?: string;
}

export function createListSkeleton({
  itemCount,
  container = 'space-y-2',
  itemHeight = 'h-20',
}: CreateListSkeletonConfig) {
  return function ListSkeletonComponent() {
    return (
      <div className={container}>
        {Array.from({ length: itemCount }).map((_, idx) => (
          <Skeleton key={idx} className={`rounded-lg ${itemHeight}`} />
        ))}
      </div>
    );
  };
}
