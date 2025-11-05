import type { ComponentPropsWithoutRef } from 'react';
import { Badge } from './badge';

type BadgeTone = 'brand' | 'success' | 'warning' | 'neutral';

type StatusToneOverrides = Partial<Record<string, BadgeTone>>;

const DEFAULT_STATUS_TONES: Record<string, BadgeTone> = {
  submitted: 'success',
  completed: 'success',
  pending: 'warning',
  open: 'warning',
  active: 'brand',
  draft: 'neutral',
};

type StatusBadgeProps = Omit<ComponentPropsWithoutRef<typeof Badge>, 'tone' | 'pill'> & {
  status: string;
  tones?: StatusToneOverrides;
};

export function StatusBadge({ status, tones, className, ...props }: StatusBadgeProps) {
  const tone = resolveTone(status, tones);

  return (
    <Badge tone={tone} pill className={className} {...props}>
      {status}
    </Badge>
  );
}

function resolveTone(status: string, overrides?: StatusToneOverrides): BadgeTone {
  const normalized = status.toLowerCase();

  if (overrides && overrides[normalized]) {
    return overrides[normalized] as BadgeTone;
  }

  return DEFAULT_STATUS_TONES[normalized] ?? 'neutral';
}
