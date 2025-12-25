import { Card, CardContent, CardHeader } from '@tacocrew/ui-kit';

export function PreviousOrdersSkeleton() {
  return (
    <Card className="shadow-[0_30px_80px_rgba(8,47,73,0.28)]">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 h-7 w-48 rounded-lg bg-slate-800" />
            <div className="h-4 w-80 rounded bg-slate-800" />
          </div>
          <div className="h-6 w-20 rounded-full bg-slate-800" />
        </div>
      </CardHeader>
      <CardContent className="gap-4">
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 rounded-xl border border-white/10 bg-slate-900/50" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
