import { Skeleton, SkeletonText } from '@tacocrew/ui-kit';

type SkeletonHeroProps = {
  readonly showBadge?: boolean;
  readonly showStats?: boolean;
  readonly statsCount?: number;
  readonly className?: string;
};

function SkeletonStatBubble({ delay = 0 }: { readonly delay?: number }) {
  return (
    <div
      className="flex h-full min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-left sm:p-5"
      style={{
        animation: 'skeleton-fade-in 0.4s ease-out forwards',
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <div className="flex items-start gap-2 text-xs uppercase leading-snug tracking-[0.15em]">
        <Skeleton delay={delay + 50} variant="circular" className="mt-0.5 h-4 w-4 shrink-0" />
        <Skeleton delay={delay + 100} className="h-3 w-24" />
      </div>
      <Skeleton delay={delay + 150} className="mt-2 h-7 w-12 sm:mt-3 sm:h-8 sm:w-16" />
    </div>
  );
}

export function SkeletonHero({
  showBadge = true,
  showStats = true,
  statsCount = 3,
  className,
}: SkeletonHeroProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm lg:p-10 ${className || ''}`}
    >
      <div className="absolute -top-24 right-0 h-60 w-60 animate-pulse rounded-full bg-brand-400/30 blur-3xl" />
      <div className="absolute -bottom-10 left-10 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" />
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-brand-500/5" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          {showBadge && <Skeleton delay={50} className="h-6 w-32 rounded-full" />}
          <Skeleton delay={100} className="h-8 w-64 lg:h-10 lg:w-80" />
          <SkeletonText lines={1} className="w-96" />
        </div>

        {showStats && (
          <div className="grid h-fit w-full grid-cols-1 items-stretch gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:w-fit sm:grid-cols-3 sm:p-5">
            {Array.from({ length: statsCount }).map((_, i) => (
              <SkeletonStatBubble key={`stat-bubble-${i}`} delay={200 + i * 100} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
