export function ProfileHeroSkeleton() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/15 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm lg:p-12">
      <div className="pointer-events-none absolute -top-24 right-0 h-60 w-60 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />

      <div className="relative">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-[minmax(180px,220px)_1fr] lg:grid-cols-[minmax(220px,260px)_1fr]">
          {/* Profile Image Skeleton */}
          <div className="flex justify-center md:justify-start">
            <div
              className="relative w-full max-w-[240px] rounded-[32px] border border-white/15 bg-slate-800"
              style={{ aspectRatio: '1 / 1' }}
            />
          </div>

          {/* User Info Skeleton */}
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-1 flex-col gap-4 text-center sm:gap-6 md:text-left lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col items-center gap-4 md:items-start lg:pr-6">
                <div className="h-12 w-2/3 rounded-lg bg-slate-800" />
                <div className="h-5 w-1/3 rounded bg-slate-800" />
              </div>
              <div className="grid w-full max-w-xs flex-shrink-0">
                <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <div className="h-3 w-16 rounded bg-slate-800" />
                  <div className="h-8 w-12 rounded bg-slate-800" />
                </div>
              </div>
            </div>

            {/* Buttons Skeleton */}
            <div className="flex flex-col gap-4 pt-4 sm:pt-6">
              <div className="border-white/10 border-t" />
              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 w-32 rounded-lg bg-slate-800" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
