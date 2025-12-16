import { Card, CardContent, CardHeader, Skeleton, SkeletonText } from '@tacocrew/ui-kit';
import { SkeletonHero } from '@/components/skeletons/SkeletonHero.tsx';

export function StockSkeleton() {
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

      {/* Card Section - Loads second */}
      <Card
        className="p-6 shadow-[0_30px_80px_rgba(8,47,73,0.28)]"
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '400ms',
          opacity: 0,
        }}
      >
        <CardHeader className="gap-4">
          <div className="space-y-2">
            <Skeleton delay={500} className="h-6 w-48" />
            <SkeletonText lines={1} className="w-64" />
          </div>
        </CardHeader>
        <CardContent className="gap-6">
          {/* Tabs Section - Loads third */}
          <div
            className="flex flex-wrap gap-2 overflow-x-auto pt-2 pb-2"
            style={{
              animation: 'skeleton-fade-in 0.5s ease-out forwards',
              animationDelay: '600ms',
              opacity: 0,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={`stock-tab-${i}`}
                delay={700 + i * 50}
                className="h-10 w-24 rounded-full"
              />
            ))}
          </div>

          {/* Content Section - Loads fourth */}
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <Skeleton delay={1000} className="h-6 w-32" />
                <SkeletonText lines={1} className="w-48" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton delay={1050} className="h-6 w-20 rounded-full" />
                <Skeleton delay={1100} className="h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Items Grid - Loads fifth */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <article
                  key={`stock-item-${i}`}
                  className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                  style={{
                    animation: 'skeleton-fade-in 0.5s ease-out forwards',
                    animationDelay: `${1200 + i * 100}ms`,
                    opacity: 0,
                  }}
                >
                  <header className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <Skeleton delay={1300 + i * 50} className="h-5 w-32" />
                      <Skeleton delay={1350 + i * 50} className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton delay={1400 + i * 50} className="h-4 w-24" />
                  </header>
                  <footer className="flex items-center justify-between">
                    <Skeleton delay={1450 + i * 50} className="h-6 w-20 rounded-full" />
                    <Skeleton delay={1500 + i * 50} className="h-5 w-16" />
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
