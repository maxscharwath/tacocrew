import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ComponentType } from 'react';
import { cn } from './utils';

const alertVariants = cva('rounded-2xl border px-4 py-3 text-sm', {
  variants: {
    tone: {
      error: 'border-rose-400/40 bg-rose-500/10 text-rose-100',
      success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
      warning: 'border-amber-400/40 bg-amber-500/10 text-amber-100',
      info: 'border-brand-400/40 bg-brand-500/10 text-brand-100',
    },
  },
  defaultVariants: {
    tone: 'info',
  },
});

const toneIcons: Record<
  NonNullable<VariantProps<typeof alertVariants>['tone']>,
  ComponentType<{ size?: number; className?: string }>
> = {
  error: XCircle,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
};

type AlertProps = ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof alertVariants> & {
    readonly title?: string;
    readonly hideIcon?: boolean;
  };

export function Alert({ tone, title, children, className, hideIcon = false, ...props }: AlertProps) {
  const Icon = toneIcons[tone ?? 'info'];

  return (
    <div className={cn(alertVariants({ tone }), className)} {...props}>
      <div className="flex items-start gap-3">
        {!hideIcon && <Icon size={20} className="mt-0.5 shrink-0" />}
        <div className="flex-1">
          {title && <p className="font-semibold">{title}</p>}
          <div className={title ? 'mt-1' : ''}>{children}</div>
        </div>
      </div>
    </div>
  );
}
