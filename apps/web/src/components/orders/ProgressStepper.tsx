import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressStep } from '@/types/orders';

/**
 * ProgressStepper - A presentational component for displaying order creation progress
 * @component
 */

type ProgressStepperProps = {
  readonly steps: ProgressStep[];
};

export function ProgressStepper({ steps }: ProgressStepperProps) {
  if (steps.length === 0) {
    return null;
  }

  const completedSteps = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="mb-6 border-white/10 border-b pb-6">
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Compact step indicators */}
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.completed;
            const isCurrent = !step.completed && (index === 0 || steps[index - 1]?.completed);

            return (
              <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    'relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-all duration-300',
                    isActive
                      ? 'scale-105 border-brand-400/60 bg-linear-to-br from-brand-500/30 to-sky-500/20 shadow-[0_2px_8px_rgba(99,102,241,0.3)]'
                      : isCurrent
                        ? 'border-brand-400/40 bg-brand-500/10 shadow-[0_1px_4px_rgba(99,102,241,0.2)]'
                        : 'border-white/20 bg-slate-800/50'
                  )}
                >
                  {isActive ? (
                    <CheckCircle2 size={14} className="text-brand-300" />
                  ) : (
                    <StepIcon
                      size={12}
                      className={isCurrent ? 'text-brand-400' : 'text-slate-500'}
                    />
                  )}
                </div>
                <p
                  className={cn(
                    'w-full truncate text-center font-medium text-[10px] transition-colors',
                    isActive ? 'text-brand-100' : isCurrent ? 'text-slate-300' : 'text-slate-500'
                  )}
                  title={step.label}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
