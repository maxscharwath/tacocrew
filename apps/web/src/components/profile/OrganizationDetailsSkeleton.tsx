import { Skeleton } from '@tacocrew/ui-kit';

/**
 * Skeleton loader for OrganizationDetails section.
 */
export function OrganizationDetailsSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/50 p-6">
      {/* Header */}
      <div className="mb-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Details grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>
  );
}
