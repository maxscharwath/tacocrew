import { Skeleton } from '@tacocrew/ui-kit';

/**
 * Skeleton loader for OrganizationMembers section.
 */
export function OrganizationMembersSkeleton() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="mb-4">
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Member list */}
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 p-3"
        >
          {/* User info */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          {/* Role/actions */}
          <Skeleton className="h-6 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}
