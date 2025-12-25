import { Skeleton } from '@tacocrew/ui-kit';

/**
 * Skeleton loader for orders grid on orders list page.
 * Shows multiple card skeletons.
 */
export function OrdersGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
          {/* Header */}
          <div className="mb-4 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Content */}
          <div className="mb-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Footer with stats */}
          <div className="flex justify-between border-white/10 border-t pt-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
