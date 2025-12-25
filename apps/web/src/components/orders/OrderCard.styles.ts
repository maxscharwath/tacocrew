/**
 * OrderCard styling configuration
 * Configuration-driven approach replaces nested ternaries
 */

export const CARD_STYLES = {
  revealed:
    'border-emerald-500/40 bg-linear-to-br from-emerald-900/20 via-slate-900/80 to-teal-900/20 shadow-[0_8px_24px_rgba(16,185,129,0.2)]',
  mystery_own:
    'border-purple-400/60 bg-linear-to-br from-purple-900/40 via-slate-900/80 to-indigo-900/40 shadow-[0_8px_24px_rgba(139,92,246,0.35)] hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/40',
  mystery_other:
    'border-purple-500/30 bg-linear-to-br from-purple-900/30 via-slate-900/70 to-indigo-900/30 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/25',
  regular_own:
    'border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40',
  regular_other:
    'border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 hover:border-brand-400/50 hover:shadow-2xl hover:shadow-brand-500/25',
} as const;

export const CARD_BASE_CLASSES =
  'group relative flex w-full flex-col transition-all duration-500 ease-in-out hover:-translate-y-0.5';

export type CardVariant = keyof typeof CARD_STYLES;

/**
 * Determine card variant based on state
 */
export function getCardVariant(state: {
  hasRevealed: boolean;
  isMystery: boolean;
  isMyOrder: boolean;
}): CardVariant {
  if (state.hasRevealed) return 'revealed';
  if (state.isMystery) return state.isMyOrder ? 'mystery_own' : 'mystery_other';
  return state.isMyOrder ? 'regular_own' : 'regular_other';
}

export const BADGE_CONFIG = {
  taco: {
    container:
      'inline-flex items-center rounded-lg border border-purple-400/35 bg-linear-to-r from-purple-500/20 to-indigo-500/20 px-2.5 py-1 font-semibold text-[11px] text-purple-100 shadow-sm transition-all duration-300',
    icon: 'mr-1 h-3 w-3 transition-transform duration-300',
  },
  meat: {
    container:
      'inline-flex items-center gap-1 rounded-lg border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 font-semibold text-[11px] text-orange-200/40 transition-all duration-500 ease-out',
    text: 'blur-[2px] transition-all duration-500 ease-out',
  },
  sauce: {
    container:
      'inline-flex items-center rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 font-medium text-[11px] text-violet-200/40 transition-all duration-500 ease-out',
    text: 'blur-[2px] transition-all duration-500 ease-out',
  },
  garniture: {
    container:
      'inline-flex items-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 font-medium text-[11px] text-emerald-200/40 transition-all duration-500 ease-out',
    text: 'blur-[2px] transition-all duration-500 ease-out',
  },
  extras: {
    container:
      'inline-flex items-center rounded-lg border border-amber-400/25 bg-amber-500/12 px-2.5 py-1 font-semibold text-[11px] text-amber-100',
  },
  drinks: {
    container:
      'inline-flex items-center rounded-lg border border-sky-400/25 bg-sky-500/12 px-2.5 py-1 font-semibold text-[11px] text-sky-100',
  },
  desserts: {
    container:
      'inline-flex items-center rounded-lg border border-rose-400/25 bg-rose-500/12 px-2.5 py-1 font-semibold text-[11px] text-rose-100',
  },
} as const;

export const BORDER_COLORS = {
  mystery: 'border-purple-500/20',
  regular: 'border-white/10',
} as const;

export function getBorderColor(isMystery: boolean): string {
  return isMystery ? BORDER_COLORS.mystery : BORDER_COLORS.regular;
}

export const TEXT_COLORS = {
  title: {
    mystery: 'text-purple-100',
    regular: 'text-white',
  },
  footer: {
    mystery: 'text-purple-300/80',
    regular: 'text-slate-400',
  },
  price: {
    mystery: 'text-purple-200',
    regular: 'text-brand-100',
  },
} as const;
