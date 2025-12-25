import { Skeleton } from '@tacocrew/ui-kit';

/**
 * Skeleton loader for OrdersList section.
 * Matches the OrdersList component layout.
 */
export function OrdersListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
          {/* User name and avatar */}
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>

          {/* Order items */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Price and actions */}
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
