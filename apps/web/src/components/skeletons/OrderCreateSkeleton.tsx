import { Card, CardContent, CardHeader, Skeleton, SkeletonText } from '@tacocrew/ui-kit';
import { SkeletonHero } from './SkeletonHero';

export function OrderCreateSkeleton() {
  return (
    <div className="space-y-8">
      {/* Back Button - Loads first */}
      <div
        className="flex items-center gap-4"
        style={{
          animation: 'skeleton-fade-in 0.5s ease-out forwards',
          animationDelay: '0ms',
          opacity: 0,
        }}
      >
        <Skeleton delay={100} className="h-5 w-32" />
      </div>

      {/* Hero Section - Loads second */}
      <div
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '200ms',
          opacity: 0,
        }}
      >
        <SkeletonHero showBadge={false} showStats={false} />
      </div>

      {/* Main Content - Loads third */}
      <div
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]"
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '600ms',
          opacity: 0,
        }}
      >
        {/* Left Column - Loads fourth */}
        <div className="space-y-8">
          <Card
            className="p-6"
            style={{
              animation: 'skeleton-fade-in 0.5s ease-out forwards',
              animationDelay: '800ms',
              opacity: 0,
            }}
          >
            <CardHeader className="space-y-2">
              <Skeleton delay={900} className="h-6 w-40" />
              <SkeletonText lines={1} className="w-64" />
            </CardHeader>
            <CardContent className="gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={`taco-skeleton-${i}`}
                    delay={1000 + i * 50}
                    className="h-32 w-full rounded-2xl"
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card
            className="p-6"
            style={{
              animation: 'skeleton-fade-in 0.5s ease-out forwards',
              animationDelay: '1200ms',
              opacity: 0,
            }}
          >
            <CardHeader className="space-y-2">
              <Skeleton delay={1300} className="h-6 w-32" />
            </CardHeader>
            <CardContent className="gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={`selection-skeleton-${i}`}
                    delay={1400 + i * 50}
                    className="h-24 w-full rounded-xl"
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={`section-card-${i}`}
                className="p-6"
                style={{
                  animation: 'skeleton-fade-in 0.5s ease-out forwards',
                  animationDelay: `${1600 + i * 200}ms`,
                  opacity: 0,
                }}
              >
                <CardHeader className="space-y-2">
                  <Skeleton delay={1700 + i * 200} className="h-6 w-40" />
                </CardHeader>
                <CardContent className="gap-4">
                  <div className="grid gap-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton
                        key={`section-${i}-item-${j}`}
                        delay={1800 + i * 200 + j * 50}
                        className="h-12 w-full rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Loads fifth */}
        <Card
          className="h-fit p-6"
          style={{
            animation: 'skeleton-fade-in 0.6s ease-out forwards',
            animationDelay: '2200ms',
            opacity: 0,
          }}
        >
          <CardHeader className="space-y-2">
            <Skeleton delay={2300} className="h-6 w-32" />
            <SkeletonText lines={1} className="w-48" />
          </CardHeader>
          <CardContent className="gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton delay={2400} className="h-4 w-24" />
                <Skeleton delay={2450} className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton delay={2500} className="h-4 w-32" />
                <Skeleton delay={2550} className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2 border-white/10 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Skeleton delay={2600} className="h-4 w-24" />
                  <Skeleton delay={2650} className="h-5 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton delay={2700} className="h-4 w-24" />
                  <Skeleton delay={2750} className="h-5 w-16" />
                </div>
                <div className="border-white/10 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Skeleton delay={2800} className="h-6 w-32" />
                    <Skeleton delay={2850} className="h-7 w-24" />
                  </div>
                </div>
              </div>
              <Skeleton delay={2900} className="h-12 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
