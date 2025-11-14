import { cn } from './utils';

type SkeletonProps = {
  readonly className?: string;
  readonly variant?: 'text' | 'circular' | 'rectangular';
  readonly delay?: number;
};

export function Skeleton({ className, variant = 'rectangular', delay = 0 }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4',
        className
      )}
      style={{
        backgroundColor: 'rgb(30 41 59 / 0.6)',
        animation: 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Shimmer effect - more visible and smooth with blur */}
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 via-white/35 to-transparent"
        style={{
          animation: 'shimmer 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          animationDelay: `${delay}ms`,
          width: '50%',
          willChange: 'transform',
          pointerEvents: 'none',
          filter: 'blur(12px)',
        }}
      />
    </div>
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  readonly lines?: number;
  readonly className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={`skeleton-line-${i}`}
          variant="text"
          delay={i * 100}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}
