import type { ComponentPropsWithoutRef } from 'react';
import { cn } from './utils';

type CardProps = ComponentPropsWithoutRef<'div'>;

export function Card({ className, ...props }: Readonly<CardProps>) {
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

export function CardHeader({ className, ...props }: Readonly<CardSectionProps>) {
  return <div className={cn('flex flex-col gap-2 px-6 pt-6 pb-3', className)} {...props} />;
}

export function CardContent({ className, ...props }: Readonly<CardSectionProps>) {
  return <div className={cn('flex flex-col gap-6 px-6 pb-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: Readonly<CardSectionProps>) {
  return <div className={cn('flex flex-col gap-4 p-6 pt-0', className)} {...props} />;
}

type CardTitleProps = ComponentPropsWithoutRef<'h2'>;

export function CardTitle({ className, ...props }: Readonly<CardTitleProps>) {
  return (
    <h2
      className={cn('font-semibold text-lg text-white tracking-tight md:text-xl', className)}
      {...props}
    />
  );
}

type CardDescriptionProps = ComponentPropsWithoutRef<'p'>;

export function CardDescription({ className, ...props }: Readonly<CardDescriptionProps>) {
  return <p className={cn('text-slate-300 text-sm', className)} {...props} />;
}
