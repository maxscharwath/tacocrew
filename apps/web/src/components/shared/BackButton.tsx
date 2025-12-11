/**
 * Consistent back button component with icon
 * @module components/shared/BackButton
 */

import { ArrowLeft } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui';
import { cx } from '@/utils/cx';

type BackButtonProps = {
  readonly to: string;
  readonly label: string;
  readonly className?: string;
};

/**
 * Standardized back button with left arrow icon
 *
 * @example
 * ```typescript
 * <BackButton
 *   to={routes.root.profile()}
 *   label={t('profile.delivery.backToProfile')}
 * />
 * ```
 */
export function BackButton({ to, label, className }: BackButtonProps): ReactElement {
  return (
    <Link to={to}>
      <Button variant="ghost" size="sm" className={cx('gap-2', className)}>
        <ArrowLeft size={18} />
        {label}
      </Button>
    </Link>
  );
}
