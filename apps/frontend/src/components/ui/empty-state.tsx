import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

type EmptyStateProps = {
  icon?: ComponentType<{ size?: number; className?: string }>;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-10 text-center',
        className
      )}
    >
      {Icon && (
        <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-800/60 text-slate-400">
          <Icon size={24} />
        </div>
      )}
      {title && <p className="text-sm font-semibold text-white">{title}</p>}
      {description && <p className="text-sm text-slate-300">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
