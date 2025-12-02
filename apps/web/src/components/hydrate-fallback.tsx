import appIcon from '@/assets/icon.png?format=webp';
import { Card, CardContent, Skeleton } from './ui';

export function HydrateFallback() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-24 absolute right-1/2 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-10 pb-20">
        <Card>
          <CardContent className="flex flex-col items-start gap-6">
            <div className="flex w-full flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-linear-to-br from-brand-400 via-brand-500 to-sky-500 font-semibold text-lg">
                  <img src={appIcon} alt="TacoCrew" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
              <Skeleton className="h-12 w-32" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`badge-${i}`} className="h-10 w-32 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={`card-${i}`} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
