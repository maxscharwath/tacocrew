import { Card, CardContent, CardHeader, Skeleton, SkeletonText } from '@tacocrew/ui-kit';
import { SkeletonHero } from './SkeletonHero';

export function DashboardSkeleton() {
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

      {/* Cards Section - Loads second */}
      <div
        className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '400ms',
          opacity: 0,
        }}
      >
        {/* Left Card */}
        <Card className="shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <Skeleton delay={500} className="h-6 w-48" />
              <SkeletonText lines={1} className="w-64" />
            </div>
            <Skeleton delay={550} className="h-6 w-32" />
          </CardHeader>
          <CardContent className="gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`dashboard-left-${i}`}
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
                  <SkeletonText lines={1} className="w-48" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton delay={800 + i * 50} className="h-6 w-16 rounded-full" />
                  <Skeleton delay={850 + i * 50} className="h-9 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Card */}
        <Card className="shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
          <CardHeader className="flex flex-col gap-3">
            <div className="space-y-2">
              <Skeleton delay={500} className="h-6 w-48" />
              <SkeletonText lines={1} className="w-64" />
            </div>
          </CardHeader>
          <CardContent className="gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`dashboard-right-${i}`}
                className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                style={{
                  animation: 'skeleton-fade-in 0.5s ease-out forwards',
                  animationDelay: `${600 + i * 100}ms`,
                  opacity: 0,
                }}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton delay={700 + i * 50} className="h-5 w-20 rounded-full" />
                    <Skeleton delay={750 + i * 50} className="h-4 w-24" />
                  </div>
                  <SkeletonText lines={1} className="w-40" />
                </div>
                <Skeleton delay={800 + i * 50} className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
