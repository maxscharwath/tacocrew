import { Skeleton, SkeletonText } from '../ui';
import { SkeletonHero } from './SkeletonHero';

export function OrdersSkeleton() {
  return (
    <div className="space-y-10">
      {/* Hero Section - Loads first */}
      <div
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '0ms',
          opacity: 0,
        }}
      >
        <SkeletonHero />
      </div>

      {/* Main Content - Loads second */}
      <div
        className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '400ms',
          opacity: 0,
        }}
      >
        {/* Orders List Section - Loads third */}
        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton delay={500} className="h-6 w-32" />
              <SkeletonText lines={1} className="w-48" />
            </div>
            <Skeleton delay={550} className="h-6 w-24 rounded-full" />
          </header>

          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <article
                key={i}
                className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                style={{
                  animation: 'skeleton-fade-in 0.5s ease-out forwards',
                  animationDelay: `${600 + i * 100}ms`,
                  opacity: 0,
                }}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton delay={700 + i * 50} className="h-6 w-32 rounded-full" />
                    <Skeleton delay={750 + i * 50} className="h-4 w-20" />
                  </div>
                  <SkeletonText lines={1} className="w-64" />
                  <SkeletonText lines={1} className="w-48" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton delay={800 + i * 50} className="h-6 w-16 rounded-full" />
                  <Skeleton delay={850 + i * 50} className="h-9 w-24 rounded-full" />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Form Section - Loads fourth */}
        <section
          className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_30px_80px_rgba(8,47,73,0.28)] backdrop-blur-sm"
          style={{
            animation: 'skeleton-fade-in 0.6s ease-out forwards',
            animationDelay: '1000ms',
            opacity: 0,
          }}
        >
          <header className="space-y-1">
            <Skeleton delay={1100} className="h-6 w-32" />
            <SkeletonText lines={1} className="w-48" />
          </header>

          <div className="grid gap-4">
            <Skeleton delay={1200} className="h-10 w-full rounded-lg" />
            <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <Skeleton delay={1300} className="h-6 w-32" />
              <Skeleton delay={1400} className="h-12 w-full rounded-lg" />
              <Skeleton delay={1500} className="h-12 w-full rounded-lg" />
              <div className="flex gap-2">
                <Skeleton delay={1600} className="h-8 w-16 rounded-full" />
                <Skeleton delay={1650} className="h-8 w-16 rounded-full" />
                <Skeleton delay={1700} className="h-8 w-16 rounded-full" />
                <Skeleton delay={1750} className="h-8 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton delay={1800} className="h-12 w-full rounded-lg" />
          </div>
        </section>
      </div>
    </div>
  );
}
