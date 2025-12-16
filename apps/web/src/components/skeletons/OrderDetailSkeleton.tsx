import { Card, CardContent, CardHeader, Skeleton, SkeletonText } from '@tacocrew/ui-kit';
import { SkeletonHero } from './SkeletonHero';

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero Section - Loads first */}
      <div
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '0ms',
          opacity: 0,
        }}
      >
        <SkeletonHero showBadge={false} showStats={true} statsCount={4} />
      </div>

      {/* Main Content - Loads second */}
      <div
        className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '400ms',
          opacity: 0,
        }}
      >
        {/* Orders List - Loads third */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-2">
              <Skeleton delay={500} className="h-6 w-48" />
              <SkeletonText lines={1} className="w-64" />
            </CardHeader>
            <CardContent className="gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`order-detail-skeleton-${i}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                  style={{
                    animation: 'skeleton-fade-in 0.5s ease-out forwards',
                    animationDelay: `${600 + i * 100}ms`,
                    opacity: 0,
                  }}
                >
                  <div className="flex flex-1 items-center gap-3">
                    <Skeleton delay={700 + i * 50} variant="circular" className="h-10 w-10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton delay={750 + i * 50} className="h-5 w-32" />
                      <SkeletonText lines={1} className="w-48" />
                    </div>
                  </div>
                  <Skeleton delay={800 + i * 50} className="h-8 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Summary Card - Loads fourth */}
        <div className="space-y-6">
          <Card
            className="p-6"
            style={{
              animation: 'skeleton-fade-in 0.6s ease-out forwards',
              animationDelay: '1000ms',
              opacity: 0,
            }}
          >
            <CardHeader className="space-y-2">
              <Skeleton delay={1100} className="h-6 w-32" />
              <SkeletonText lines={1} className="w-48" />
            </CardHeader>
            <CardContent className="gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton delay={1200} className="h-4 w-24" />
                  <Skeleton delay={1250} className="h-5 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton delay={1300} className="h-4 w-24" />
                  <Skeleton delay={1350} className="h-5 w-16" />
                </div>
                <div className="border-white/10 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Skeleton delay={1400} className="h-6 w-32" />
                    <Skeleton delay={1450} className="h-7 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
