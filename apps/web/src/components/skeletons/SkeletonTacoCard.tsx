import { Skeleton } from '../ui';

export function SkeletonTacoCard() {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-5 shadow-[0_8px_24px_rgba(99,102,241,0.35)]">
      <div className="flex flex-1 flex-col space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton variant="circular" className="h-12 w-12" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-18 rounded-lg" />
          </div>
        </div>

        <div className="mt-auto border-white/10 border-t pt-3">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
