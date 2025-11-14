import type { ReactNode } from 'react';
import { cn } from './utils';

type DividerProps = {
  label?: ReactNode;
  className?: string;
  lineClassName?: string;
  labelClassName?: string;
};

export function Divider({
  label,
  className,
  lineClassName,
  labelClassName,
}: Readonly<DividerProps>) {
  if (!label) {
    return (
      <div className={cn('flex items-center', className)}>
        <span className={cn('h-px w-full bg-white/10', lineClassName)} />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 text-xs uppercase', className)}>
      <span className={cn('h-px flex-1 bg-white/10', lineClassName)} />
      <span className={cn('whitespace-nowrap text-slate-400', labelClassName)}>
        {label}
      </span>
      <span className={cn('h-px flex-1 bg-white/10', lineClassName)} />
    </div>
  );
}
