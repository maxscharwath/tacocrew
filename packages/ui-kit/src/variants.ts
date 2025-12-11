/**
 * Common variant definitions for UI components using CVA
 * Ensures consistency across all components
 */

import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Tone variants - used for alerts, badges, status indicators
 */
export const toneVariants = cva('', {
  variants: {
    tone: {
      brand: 'border-brand-400/50 bg-brand-500/15 text-brand-50',
      success: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-50',
      warning: 'border-amber-400/50 bg-amber-500/15 text-amber-50',
      error: 'border-rose-400/50 bg-rose-500/15 text-rose-50',
      info: 'border-brand-400/40 bg-brand-500/10 text-brand-100',
      neutral: 'border-gray-700 bg-slate-800/80 text-slate-200',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

export type Tone = VariantProps<typeof toneVariants>['tone'];

/**
 * Size variants
 */
export const sizeVariants = cva('', {
  variants: {
    size: {
      xs: 'h-7 px-3 text-xs',
      sm: 'h-9 px-4 text-xs',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
      xl: 'h-14 px-8 text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type Size = VariantProps<typeof sizeVariants>['size'];

/**
 * Button variant styles using shadcn-style semantic tokens
 * - Solid border colors (no transparency)
 * - Borders don't change color on hover/focus
 * - Only background and text change on hover
 */
export const buttonVariants = cva(
  'items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: '',
        destructive: '',
        outline: '',
        secondary: '',
        ghost: '',
        link: '',
        tab: '',
      },
      color: {
        brand: '',
        rose: '',
        amber: '',
        emerald: '',
        violet: '',
        sky: '',
        cyan: '',
      },
      pill: {
        true: 'rounded-full',
        false: 'rounded-xl',
      },
      size: {
        sm: 'h-9 px-4 text-xs has-[>svg]:px-3',
        md: 'h-11 px-5 text-sm has-[>svg]:px-4',
        lg: 'h-12 px-6 text-base has-[>svg]:px-5',
      },
      fullWidth: {
        true: 'flex w-full',
        false: 'inline-flex',
      },
    },
    compoundVariants: [
      // Default (primary) variant
      {
        variant: 'default',
        color: undefined,
        class: 'border border-brand-400 bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-600 text-white shadow-brand-500/30 shadow-xl hover:from-brand-600 hover:via-brand-700 hover:to-indigo-700 focus-visible:ring-brand-500/50',
      },
      {
        variant: 'default',
        color: 'brand',
        class: 'border border-brand-400 bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-600 text-white shadow-brand-500/30 shadow-xl hover:from-brand-600 hover:via-brand-700 hover:to-indigo-700 focus-visible:ring-brand-500/50',
      },
      {
        variant: 'default',
        color: 'rose',
        class: 'border border-rose-400 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white shadow-rose-500/30 shadow-xl hover:from-rose-600 hover:via-rose-700 hover:to-pink-700 focus-visible:ring-rose-500/50',
      },
      {
        variant: 'default',
        color: 'amber',
        class: 'border border-amber-400 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 shadow-amber-500/30 shadow-xl hover:from-amber-600 hover:via-amber-700 hover:to-yellow-700 focus-visible:ring-amber-500/50',
      },
      {
        variant: 'default',
        color: 'emerald',
        class: 'border border-emerald-400 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-emerald-500/30 shadow-xl hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 focus-visible:ring-emerald-500/50',
      },
      {
        variant: 'default',
        color: 'violet',
        class: 'border border-violet-400 bg-gradient-to-r from-violet-500 via-violet-600 to-purple-600 text-white shadow-violet-500/30 shadow-xl hover:from-violet-600 hover:via-violet-700 hover:to-purple-700 focus-visible:ring-violet-500/50',
      },
      {
        variant: 'default',
        color: 'sky',
        class: 'border border-sky-400 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white shadow-sky-500/30 shadow-xl hover:from-sky-600 hover:via-sky-700 hover:to-blue-700 focus-visible:ring-sky-500/50',
      },
      {
        variant: 'default',
        color: 'cyan',
        class: 'border border-cyan-400 bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-600 text-white shadow-cyan-500/30 shadow-xl hover:from-cyan-600 hover:via-cyan-700 hover:to-teal-700 focus-visible:ring-cyan-500/50',
      },

      // Destructive variant
      {
        variant: 'destructive',
        class: 'border border-error-500 bg-gradient-to-r from-error-600 via-error-700 to-red-700 text-white shadow-error-500/30 shadow-xl hover:from-error-700 hover:via-error-800 hover:to-red-800 focus-visible:ring-error-500/50',
      },

      // Outline variant - solid borders, no transparency, border stays same on hover
      {
        variant: 'outline',
        color: undefined,
        class: 'border border-gray-700 bg-transparent text-slate-100 hover:bg-slate-800/60 hover:text-white',
      },
      {
        variant: 'outline',
        color: 'brand',
        class: 'border border-brand-400 bg-transparent text-brand-50 hover:bg-brand-500/10',
      },
      {
        variant: 'outline',
        color: 'rose',
        class: 'border border-rose-400 bg-transparent text-rose-50 hover:bg-rose-500/10',
      },
      {
        variant: 'outline',
        color: 'amber',
        class: 'border border-amber-400 bg-transparent text-amber-50 hover:bg-amber-500/10',
      },
      {
        variant: 'outline',
        color: 'emerald',
        class: 'border border-emerald-400 bg-transparent text-emerald-50 hover:bg-emerald-500/10',
      },
      {
        variant: 'outline',
        color: 'violet',
        class: 'border border-violet-400 bg-transparent text-violet-50 hover:bg-violet-500/10',
      },
      {
        variant: 'outline',
        color: 'sky',
        class: 'border border-sky-400 bg-transparent text-sky-50 hover:bg-sky-500/10',
      },
      {
        variant: 'outline',
        color: 'cyan',
        class: 'border border-cyan-400 bg-transparent text-cyan-50 hover:bg-cyan-500/10',
      },

      // Secondary variant - solid borders, subtle backgrounds
      {
        variant: 'secondary',
        color: undefined,
        class: 'border border-gray-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80 hover:text-white',
      },
      {
        variant: 'secondary',
        color: 'brand',
        class: 'border border-brand-400 bg-brand-500/10 text-brand-50 hover:bg-brand-500/20',
      },
      {
        variant: 'secondary',
        color: 'rose',
        class: 'border border-rose-400 bg-rose-500/10 text-rose-50 hover:bg-rose-500/20',
      },
      {
        variant: 'secondary',
        color: 'amber',
        class: 'border border-amber-400 bg-amber-500/10 text-amber-50 hover:bg-amber-500/20',
      },
      {
        variant: 'secondary',
        color: 'emerald',
        class: 'border border-emerald-400 bg-emerald-500/10 text-emerald-50 hover:bg-emerald-500/20',
      },
      {
        variant: 'secondary',
        color: 'violet',
        class: 'border border-violet-400 bg-violet-500/10 text-violet-50 hover:bg-violet-500/20',
      },
      {
        variant: 'secondary',
        color: 'sky',
        class: 'border border-sky-400 bg-sky-500/10 text-sky-50 hover:bg-sky-500/20',
      },
      {
        variant: 'secondary',
        color: 'cyan',
        class: 'border border-cyan-400 bg-cyan-500/10 text-cyan-50 hover:bg-cyan-500/20',
      },

      // Ghost variant - minimal styling with subtle hover effects
      {
        variant: 'ghost',
        color: undefined,
        class: 'border border-transparent text-slate-200 hover:border-gray-700 hover:bg-slate-800/60 hover:text-brand-50',
      },
      {
        variant: 'ghost',
        color: 'brand',
        class: 'border border-transparent text-brand-50 hover:border-brand-400/30 hover:bg-brand-500/10',
      },
      {
        variant: 'ghost',
        color: 'rose',
        class: 'border border-transparent text-rose-50 hover:border-rose-400/30 hover:bg-rose-500/10',
      },
      {
        variant: 'ghost',
        color: 'amber',
        class: 'border border-transparent text-amber-50 hover:border-amber-400/30 hover:bg-amber-500/10',
      },
      {
        variant: 'ghost',
        color: 'emerald',
        class: 'border border-transparent text-emerald-50 hover:border-emerald-400/30 hover:bg-emerald-500/10',
      },
      {
        variant: 'ghost',
        color: 'violet',
        class: 'border border-transparent text-violet-50 hover:border-violet-400/30 hover:bg-violet-500/10',
      },
      {
        variant: 'ghost',
        color: 'sky',
        class: 'border border-transparent text-sky-50 hover:border-sky-400/30 hover:bg-sky-500/10',
      },
      {
        variant: 'ghost',
        color: 'cyan',
        class: 'border border-transparent text-cyan-50 hover:border-cyan-400/30 hover:bg-cyan-500/10',
      },

      // Link variant
      {
        variant: 'link',
        class: 'border border-transparent text-brand-50 underline-offset-4 hover:underline',
      },

      // Tab variant - solid border, doesn't change on hover
      {
        variant: 'tab',
        color: undefined,
        class: 'flex items-center gap-2 rounded-full border border-gray-700 bg-slate-900/60 px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em] text-slate-300 transition hover:bg-slate-800/60 hover:text-brand-50',
      },
      {
        variant: 'tab',
        color: 'brand',
        class: `flex items-center gap-2 rounded-full border border-brand-400 bg-brand-500/20 px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em] text-brand-50 transition shadow-[0_12px_40px_rgba(99,102,241,0.25)] hover:bg-brand-500/30`,
      },
      {
        variant: 'tab',
        color: 'rose',
        class: `flex items-center gap-2 rounded-full border border-rose-400 bg-rose-500/20 px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em] text-rose-50 transition shadow-[0_12px_40px_rgba(244,114,182,0.25)] hover:bg-rose-500/30`,
      },
      {
        variant: 'tab',
        color: 'amber',
        class: `flex items-center gap-2 rounded-full border border-amber-400 bg-amber-500/20 px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em] text-amber-50 transition shadow-[0_12px_40px_rgba(251,191,36,0.25)] hover:bg-amber-500/30`,
      },
      {
        variant: 'tab',
        color: 'emerald',
        class: `flex items-center gap-2 rounded-full border border-emerald-400 bg-emerald-500/20 px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em] text-emerald-50 transition shadow-[0_12px_40px_rgba(16,185,129,0.25)] hover:bg-emerald-500/30`,
      },
      {
        variant: 'tab',
        color: 'violet',
        class: `flex items-center gap-2 rounded-full border border-violet-400 bg-violet-500/20 px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em] text-violet-50 transition shadow-[0_12px_40px_rgba(167,139,250,0.25)] hover:bg-violet-500/30`,
      },
      {
        variant: 'tab',
        color: 'sky',
        class: `flex items-center gap-2 rounded-full border border-sky-400 bg-sky-500/20 px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em] text-sky-50 transition shadow-[0_12px_40px_rgba(14,165,233,0.25)] hover:bg-sky-500/30`,
      },
      {
        variant: 'tab',
        color: 'cyan',
        class: `flex items-center gap-2 rounded-full border border-cyan-400 bg-cyan-500/20 px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em] text-cyan-50 transition shadow-[0_12px_40px_rgba(34,211,238,0.25)] hover:bg-cyan-500/30`,
      },
    ],
    defaultVariants: {
      variant: 'default',
      pill: false,
      size: 'md',
      fullWidth: false,
    },
  }
);

export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonColor = VariantProps<typeof buttonVariants>['color'];
