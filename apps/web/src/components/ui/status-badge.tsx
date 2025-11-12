import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  closed: 'neutral',
};

type StatusBadgeProps = Omit<ComponentPropsWithoutRef<typeof Badge>, 'tone' | 'pill'> & {
  status: string;
  tones?: StatusToneOverrides;
};

export function StatusBadge({ status, tones, className, ...props }: StatusBadgeProps) {
  const { t } = useTranslation();
  const tone = resolveTone(status, tones);
  const normalized = normalizeStatus(status);
  const fallbackLabel = formatStatusLabel(status);
  const label = t(`common.status.${normalized}`, { defaultValue: fallbackLabel });

  return (
    <Badge tone={tone} pill className={className} {...props}>
      {label}
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

function normalizeStatus(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
