import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type CardProps = ComponentPropsWithoutRef<'div'>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-slate-900/70 shadow-[0_30px_90px_rgba(8,47,73,0.35)] backdrop-blur',
        className
      )}
      {...props}
    />
  );
}

type CardSectionProps = ComponentPropsWithoutRef<'div'>;

export function CardHeader({ className, ...props }: CardSectionProps) {
  return <div className={cn('flex flex-col gap-2', className)} {...props} />;
}

export function CardContent({ className, ...props }: CardSectionProps) {
  return <div className={cn('flex flex-col gap-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardSectionProps) {
  return <div className={cn('flex flex-col gap-4', className)} {...props} />;
}

type CardTitleProps = ComponentPropsWithoutRef<'h2'>;

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h2
      className={cn('text-lg font-semibold tracking-tight text-white md:text-xl', className)}
      {...props}
    />
  );
}

type CardDescriptionProps = ComponentPropsWithoutRef<'p'>;

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p className={cn('text-sm text-slate-300', className)} {...props} />;
}
