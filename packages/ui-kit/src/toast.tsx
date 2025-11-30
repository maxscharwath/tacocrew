/**
 * Toast Component
 * A composable toast/notification system built on Sonner
 * Styled to match the TacoBot design system
 */

import { CheckCircle2, Info, Loader2, OctagonX, TriangleAlert } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
export { toast, type ToasterProps, type ExternalToast } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-slate-900/70 group-[.toaster]:backdrop-blur group-[.toaster]:text-slate-100 group-[.toaster]:border group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_30px_90px_rgba(8,47,73,0.35)] group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3',
          title: 'group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:text-sm',
          description: 'group-[.toast]:text-slate-300 group-[.toast]:text-sm',
          actionButton:
            'group-[.toast]:bg-brand-500 group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:font-semibold group-[.toast]:text-xs group-[.toast]:h-8 group-[.toast]:px-3',
          cancelButton:
            'group-[.toast]:bg-slate-800 group-[.toast]:text-slate-300 group-[.toast]:rounded-xl group-[.toast]:text-xs group-[.toast]:h-8 group-[.toast]:px-3',
          closeButton:
            'group-[.toast]:bg-slate-800/80 group-[.toast]:border-white/10 group-[.toast]:text-slate-400 group-[.toast]:hover:bg-slate-700 group-[.toast]:hover:text-white group-[.toast]:transition-colors',
          success:
            'group-[.toaster]:border-emerald-400/40 group-[.toaster]:bg-emerald-500/10 [&>svg]:text-emerald-400 group-[.toaster]:text-emerald-100',
          error:
            'group-[.toaster]:border-rose-400/40 group-[.toaster]:bg-rose-500/10 [&>svg]:text-rose-400 group-[.toaster]:text-rose-100',
          warning:
            'group-[.toaster]:border-amber-400/40 group-[.toaster]:bg-amber-500/10 [&>svg]:text-amber-400 group-[.toaster]:text-amber-100',
          info: 'group-[.toaster]:border-brand-400/40 group-[.toaster]:bg-brand-500/10 [&>svg]:text-brand-400 group-[.toaster]:text-brand-100',
        },
      }}
      icons={{
        success: <CheckCircle2 className="size-5 shrink-0" />,
        info: <Info className="size-5 shrink-0" />,
        warning: <TriangleAlert className="size-5 shrink-0" />,
        error: <OctagonX className="size-5 shrink-0" />,
        loading: <Loader2 className="size-5 shrink-0 animate-spin text-brand-400" />,
      }}
      {...props}
    />
  );
};

export { Toaster };

