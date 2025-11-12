import { AlertCircle, CheckCircle, InfoCircle, XCircle } from '@untitledui/icons';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type AlertTone = 'error' | 'success' | 'warning' | 'info';

type AlertProps = ComponentPropsWithoutRef<'div'> & {
  tone?: AlertTone;
  title?: string;
};

const toneStyles: Record<AlertTone, string> = {
  error: 'border-rose-400/40 bg-rose-500/10 text-rose-100',
  success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
  warning: 'border-amber-400/40 bg-amber-500/10 text-amber-100',
  info: 'border-brand-400/40 bg-brand-500/10 text-brand-100',
};

const toneIcons: Record<AlertTone, typeof AlertCircle> = {
  error: XCircle,
  success: CheckCircle,
  warning: AlertCircle,
  info: InfoCircle,
};

export function Alert({ tone = 'info', title, children, className, ...props }: AlertProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      className={cn('rounded-2xl border px-4 py-3 text-sm', toneStyles[tone], className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          {title && <p className="font-semibold">{title}</p>}
          <div className={title ? 'mt-1' : ''}>{children}</div>
        </div>
      </div>
    </div>
  );
}
