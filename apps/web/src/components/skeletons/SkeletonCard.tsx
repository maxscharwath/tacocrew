import { Card, CardContent, CardHeader, Skeleton, SkeletonText } from '@tacocrew/ui-kit';

type SkeletonCardProps = {
  readonly showHeader?: boolean;
  readonly showDescription?: boolean;
  readonly contentLines?: number;
  readonly className?: string;
};

export function SkeletonCard({
  showHeader = true,
  showDescription = true,
  contentLines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          {showDescription && <SkeletonText lines={1} className="w-64" />}
        </CardHeader>
      )}
      <CardContent className="gap-4">
        {Array.from({ length: contentLines }).map((_, i) => (
          <Skeleton key={`skeleton-card-${i}`} className="h-20 w-full rounded-2xl" />
        ))}
      </CardContent>
    </Card>
  );
}
