import { Skeleton } from '@tacocrew/ui-kit';

/**
 * Skeleton loader for OrderHero section.
 * Matches the OrderHero component layout.
 */
export function OrderHeroSkeleton() {
  return (
    <div className="space-y-6 rounded-lg border border-white/10 bg-slate-900/50 p-6">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Status badges */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>

      {/* Total price */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
}
