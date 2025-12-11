/**
 * Standardized page hero section with gradient backgrounds and decorative elements
 * @module components/shared/PageHero
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from '@/utils/cx';

type ColorVariant = 'brand' | 'amber' | 'purple' | 'green';

type PageHeroProps = {
  readonly variant?: ColorVariant;
  readonly icon?: LucideIcon;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly children?: ReactNode;
  readonly className?: string;
};

const VARIANT_STYLES: Record<
  ColorVariant,
  {
    background: string;
    glow1: string;
    glow2: string;
    iconGradient: string;
  }
> = {
  brand: {
    background: 'from-brand-500/15 via-slate-900/80 to-slate-950/90',
    glow1: 'bg-brand-400/20',
    glow2: 'bg-purple-500/15',
    iconGradient: 'from-brand-400 via-brand-500 to-sky-500',
  },
  amber: {
    background: 'from-amber-500/10 via-slate-900/80 to-slate-950/90',
    glow1: 'bg-amber-400/20',
    glow2: 'bg-rose-500/20',
    iconGradient: 'from-amber-400 via-amber-500 to-rose-500',
  },
  purple: {
    background: 'from-purple-500/10 via-slate-900/80 to-slate-950/90',
    glow1: 'bg-purple-400/20',
    glow2: 'bg-pink-500/20',
    iconGradient: 'from-purple-400 via-purple-500 to-pink-500',
  },
  green: {
    background: 'from-green-500/10 via-slate-900/80 to-slate-950/90',
    glow1: 'bg-green-400/20',
    glow2: 'bg-emerald-500/20',
    iconGradient: 'from-green-400 via-green-500 to-emerald-500',
  },
};

/**
 * Page hero section with gradient background, decorative glows, and optional icon
 *
 * @example
 * ```typescript
 * <PageHero
 *   variant="amber"
 *   icon={Lock}
 *   title={tt('title')}
 *   subtitle={tt('subtitle')}
 * >
 *   <Card>
 *     <CardContent>
 *       Stats or additional content
 *     </CardContent>
 *   </Card>
 * </PageHero>
 * ```
 */
export function PageHero({
  variant = 'brand',
  icon: Icon,
  title,
  subtitle,
  children,
  className = '',
}: PageHeroProps): ReactElement {
  const styles = VARIANT_STYLES[variant];

  return (
    <section
      className={cx(
        'relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br p-8',
        styles.background,
        className
      )}
    >
      {/* Decorative glows */}
      <div
        className={cx(
          '-top-24 pointer-events-none absolute right-0 h-72 w-72 rounded-full blur-3xl',
          styles.glow1
        )}
      />
      <div
        className={cx(
          '-bottom-16 pointer-events-none absolute left-12 h-60 w-60 rounded-full blur-3xl',
          styles.glow2
        )}
      />

      <div className="relative space-y-4">
        {/* Header with icon, title, and subtitle */}
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={cx(
                'grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br',
                styles.iconGradient
              )}
            >
              <Icon size={24} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="font-semibold text-2xl text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-slate-300 text-sm">{subtitle}</p>}
          </div>
        </div>

        {/* Optional children (stats, actions, etc.) */}
        {children}
      </div>
    </section>
  );
}
