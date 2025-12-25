import { Skeleton } from '@tacocrew/ui-kit';

/**
 * Skeleton loader for GroupOrderReceipts section.
 * Matches the GroupOrderReceipts component layout.
 */
export function GroupOrderReceiptsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
      </div>

      {/* Receipt cards */}
      {Array.from({ length: 2 }).map((_, idx) => (
        <div key={idx} className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
          {/* Receipt header with user */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Receipt items */}
          <div className="space-y-2 border-white/10 border-t pt-4">
            {Array.from({ length: 3 }).map((_, itemIdx) => (
              <div key={itemIdx} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>

          {/* Subtotal and actions */}
          <div className="mt-4 flex items-center justify-between border-white/10 border-t pt-4">
            <Skeleton className="h-5 w-20" />
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
