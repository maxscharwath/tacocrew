import type { ComponentPropsWithoutRef } from 'react';
import { Badge } from './badge';

type BadgeTone = 'brand' | 'success' | 'warning' | 'neutral';

type StatusToneOverrides = Partial<Record<string, BadgeTone>>;

const DEFAULT_STATUS_TONES: Record<string, BadgeTone> = {
  submitted: 'success',
  pending: 'warning',
  open: 'warning',
  active: 'brand',
  draft: 'neutral',
  closed: 'neutral',
  expired: 'neutral',
};

type StatusBadgeProps = Omit<ComponentPropsWithoutRef<typeof Badge>, 'tone' | 'pill'> & {
  status: string;
  tones?: StatusToneOverrides;
  label?: string;
};

export function StatusBadge({ status, tones, className, label, ...props }: StatusBadgeProps) {
  const tone = resolveTone(status, tones);
  const displayLabel = label ?? formatStatusLabel(status);

  return (
    <Badge tone={tone} pill className={className} {...props}>
      {displayLabel}
    </Badge>
  );
}

function resolveTone(status: string, overrides?: StatusToneOverrides): BadgeTone {
  const normalized = status.toLowerCase();

  if (overrides?.[normalized]) {
    return overrides[normalized];
  }

  return DEFAULT_STATUS_TONES[normalized] ?? 'neutral';
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
