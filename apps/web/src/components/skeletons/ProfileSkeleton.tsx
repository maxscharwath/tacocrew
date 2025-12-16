import { Card, CardContent, CardHeader, Skeleton, SkeletonText } from '@tacocrew/ui-kit';
import { SkeletonTacoCard } from './SkeletonTacoCard';

export function ProfileSkeleton() {
  return (
    <div className="space-y-10">
      {/* Hero Section - Loads first */}
      <section
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-6 lg:p-8"
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '0ms',
          opacity: 0,
        }}
      >
        <div className="-top-24 pointer-events-none absolute right-0 h-60 w-60 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="-bottom-16 pointer-events-none absolute left-10 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Skeleton delay={100} className="h-6 w-32 rounded-full" />
            <div className="space-y-2 text-right">
              <Skeleton delay={150} className="h-4 w-24" />
              <Skeleton delay={200} className="h-8 w-16" />
              <Skeleton delay={250} className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-1">
            <Skeleton delay={300} className="h-8 w-48 lg:h-10 lg:w-64" />
            <SkeletonText lines={1} className="w-64" />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-white/10 border-t pt-4">
            <Skeleton delay={400} className="h-10 w-40 rounded-lg" />
            <div className="flex-1" />
            <Skeleton delay={450} className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Card Section - Loads second */}
      <Card
        className="p-6 shadow-[0_30px_80px_rgba(8,47,73,0.28)]"
        style={{
          animation: 'skeleton-fade-in 0.6s ease-out forwards',
          animationDelay: '500ms',
          opacity: 0,
        }}
      >
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton delay={600} className="h-6 w-40" />
            <Skeleton delay={650} className="h-6 w-20 rounded-full" />
          </div>
          <SkeletonText lines={1} className="w-64" />
        </CardHeader>
        <CardContent className="gap-4">
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`profile-skeleton-${i}`}
                style={{
                  animation: 'skeleton-fade-in 0.5s ease-out forwards',
                  animationDelay: `${700 + i * 100}ms`,
                  opacity: 0,
                }}
              >
                <SkeletonTacoCard />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
