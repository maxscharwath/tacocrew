import type { ComponentType, ReactNode } from 'react';
import { cn } from './utils';

type EmptyStateProps = {
  readonly icon?: ComponentType<{ size?: number; className?: string }>;
  readonly title?: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-2xl border border-gray-700 border-dashed bg-slate-900/50 p-10 text-center',
        className
      )}
    >
      {Icon && (
        <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-800/60 text-slate-400">
          <Icon size={24} />
        </div>
      )}
      {title && <p className="font-semibold text-sm text-white">{title}</p>}
      {description && <p className="text-slate-300 text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
