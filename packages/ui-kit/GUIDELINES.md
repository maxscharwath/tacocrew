# UI-Kit Package Coding Guidelines

> **Package**: @tacocrew/ui-kit
> **Purpose**: Shared React component library and design system
> **Framework**: React + Tailwind CSS + Radix UI

## Table of Contents

- [Package Purpose](#package-purpose)
- [Component Development](#component-development)
- [Documentation & Storybook Requirements](#documentation--storybook-requirements)
- [Design System](#design-system)
- [Styling Conventions](#styling-conventions)
- [Radix UI Integration](#radix-ui-integration)
- [Exports](#exports)
- [Testing Guidelines](#testing-guidelines)
- [Code Review Checklist](#code-review-checklist)

---

## Package Purpose

The UI-Kit package serves as the **single source of truth** for:
- ✅ Shared React components
- ✅ Design system tokens (colors, spacing, shadows, etc.)
- ✅ Component variants and styling patterns
- ✅ Accessibility standards via Radix UI

**Who uses UI-Kit?**
- `apps/web` - Main web application
- `apps/storybook` - Component documentation
- Future projects in the monorepo

**Design Philosophy**:
- **Composable**: Build complex UIs from simple, focused components
- **Accessible**: Built on Radix UI primitives
- **Consistent**: Centralized design tokens
- **Flexible**: Variants for different use cases
- **Type-safe**: Full TypeScript support

---

## Component Development

### Component Template

**✅ DO** follow this structure for all components:

```typescript
// button.tsx
import type { ButtonHTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from './utils';
import { buttonVariants } from './variants';

// 1. Define props type
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    readonly loading?: boolean;
    readonly children?: React.ReactNode;
  };

// 2. Export component function
export function Button({
  className,
  variant,
  color,
  size,
  pill,
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        buttonVariants({ variant, color, size, pill, fullWidth }),
        isDisabled && 'cursor-not-allowed opacity-50',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && <RefreshCw size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
```

### Variant Definition with CVA

**✅ DO** define variants in `variants.ts`:

```typescript
// variants.ts
import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  // Base styles (always applied)
  'inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none',
  {
    variants: {
      // Variant dimension 1: Visual style
      variant: {
        primary: '',
        secondary: 'border',
        outline: 'border bg-transparent',
        ghost: 'bg-transparent hover:bg-slate-100',
      },
      // Variant dimension 2: Color scheme
      color: {
        brand: '',
        rose: '',
        amber: '',
        emerald: '',
        slate: '',
      },
      // Variant dimension 3: Size
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      // Variant dimension 4: Shape
      pill: {
        true: 'rounded-full',
        false: 'rounded-xl',
      },
      // Variant dimension 5: Width
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    // Compound variants (combinations)
    compoundVariants: [
      {
        variant: 'primary',
        color: 'brand',
        class: 'border-brand-400/50 bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700',
      },
      {
        variant: 'primary',
        color: 'rose',
        class: 'border-rose-400/50 bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700',
      },
      {
        variant: 'outline',
        color: 'brand',
        class: 'border-brand-400 text-brand-500 hover:bg-brand-50',
      },
    ],
    // Default values
    defaultVariants: {
      variant: 'primary',
      color: 'brand',
      size: 'md',
      pill: false,
      fullWidth: false,
    },
  }
);
```

### Prop Typing Conventions

**✅ DO** extend base HTML element types:

```typescript
// For buttons
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly loading?: boolean;
};

// For inputs
type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  readonly error?: string;
};

// For divs
type CardProps = HTMLAttributes<HTMLDivElement> & {
  readonly elevated?: boolean;
};
```

**✅ DO** include variant props via `VariantProps`:

```typescript
import type { VariantProps } from 'class-variance-authority';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    // variant, color, size, pill, fullWidth are automatically included
    readonly loading?: boolean;
  };
```

**✅ DO** mark all props as `readonly`:

```typescript
type CardProps = {
  readonly children?: React.ReactNode;
  readonly elevated?: boolean;
  readonly className?: string;
};
```

### Compound Components

**✅ DO** use compound component pattern for related components:

```typescript
// card.tsx
import type { HTMLAttributes } from 'react';
import { cn } from './utils';

// Parent component
type CardProps = HTMLAttributes<HTMLDivElement> & {
  readonly elevated?: boolean;
};

export function Card({ elevated, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white',
        elevated && 'shadow-lg',
        className
      )}
      {...props}
    />
  );
}

// Child components
type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ className, ...props }: CardTitleProps) {
  return <h3 className={cn('font-semibold leading-none', className)} {...props} />;
}

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p className={cn('text-sm text-slate-500', className)} {...props} />;
}

type CardContentProps = HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}
```

**Usage**:

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@tacocrew/ui-kit';

<Card elevated>
  <CardHeader>
    <CardTitle>Order Summary</CardTitle>
    <CardDescription>Review your taco order</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Order items */}
  </CardContent>
  <CardFooter>
    <Button>Submit Order</Button>
  </CardFooter>
</Card>
```

### Forwarding Refs

**✅ DO** forward refs for form components:

```typescript
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './utils';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  readonly error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-slate-200 bg-slate-950/60 px-4 py-2',
          'text-sm transition-colors',
          'placeholder:text-slate-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-rose-500 focus-visible:ring-rose-500',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

**Why forward refs?**
- ✅ Required for form libraries (React Hook Form, etc.)
- ✅ Allows parent components to access DOM elements
- ✅ Enables imperative actions (focus, scroll, etc.)

---

## Documentation & Storybook Requirements

### **CRITICAL RULE**: Every Component Must Have Documentation + Storybook

**❌ DON'T** create a component without documentation:

```typescript
// Bad - No documentation or Storybook story
export function Button({ children, ...props }: ButtonProps) {
  return <button {...props}>{children}</button>;
}
// ❌ No JSDoc comments
// ❌ No Storybook story file
// ❌ No usage examples
```

**✅ DO** provide complete documentation for every component:

```typescript
/**
 * Button component with multiple variants and states.
 *
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="default" color="brand">
 *   Submit Order
 * </Button>
 *
 * // Loading state
 * <Button loading>Processing...</Button>
 *
 * // With icon
 * <Button>
 *   <CheckIcon /> Confirm
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  color = 'brand',
  size = 'md',
  loading,
  children,
  ...props
}: ButtonProps) {
  // Implementation
}
```

### JSDoc Documentation Requirements

**✅ DO** add JSDoc comments to all components:

```typescript
/**
 * Card container component with optional elevation.
 * Part of the Card compound component family.
 *
 * @param elevated - Add shadow elevation to the card
 * @param className - Additional CSS classes to apply
 * @param children - Card content (typically CardHeader, CardContent, CardFooter)
 *
 * @example
 * ```tsx
 * <Card elevated>
 *   <CardHeader>
 *     <CardTitle>Order Summary</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     {/* Content */}
 *   </CardContent>
 * </Card>
 * ```
 *
 * @see {@link CardHeader}
 * @see {@link CardContent}
 * @see {@link CardFooter}
 */
export function Card({ elevated, className, ...props }: CardProps) {
  // Implementation
}
```

**Required JSDoc sections**:
- Description of what the component does
- `@param` for each prop (especially non-obvious ones)
- `@example` with realistic usage examples
- `@see` for related components

### Storybook Story Requirements

**File naming**: `{component}.stories.tsx`

**✅ DO** create comprehensive Storybook stories:

```typescript
// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { CheckIcon, TrashIcon } from 'lucide-react';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Versatile button component with multiple variants, colors, and states. Supports loading state and can be used with icons.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
      description: 'Visual style variant',
    },
    color: {
      control: 'select',
      options: ['brand', 'rose', 'amber', 'emerald', 'slate'],
      description: 'Color scheme',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner and disable button',
    },
    pill: {
      control: 'boolean',
      description: 'Use pill-shaped (fully rounded) style',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Expand to full width of container',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 1. Default/Primary story
export const Primary: Story = {
  args: {
    variant: 'primary',
    color: 'brand',
    children: 'Button',
  },
};

// 2. All variants
export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

// 3. All colors
export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button color="brand">Brand</Button>
        <Button color="rose">Rose</Button>
        <Button color="amber">Amber</Button>
        <Button color="emerald">Emerald</Button>
      </div>
    </div>
  ),
};

// 4. All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// 5. States
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

// 6. With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>
        <CheckIcon size={16} />
        Confirm
      </Button>
      <Button variant="outline" color="rose">
        <TrashIcon size={16} />
        Delete
      </Button>
    </div>
  ),
};

// 7. Real-world usage
export const RealWorld: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-8">
      <h3 className="text-lg font-semibold">Order Form</h3>
      <div className="flex gap-3">
        <Button variant="outline" color="slate">
          Cancel
        </Button>
        <Button variant="default" color="brand">
          Submit Order
        </Button>
      </div>
    </div>
  ),
};
```

### Required Storybook Stories

Every component **MUST** include these stories:

1. **Default/Primary** - Basic usage with default props
2. **All Variants** - Show all variant options side-by-side
3. **All Sizes** (if applicable) - Show all size options
4. **All Colors** (if applicable) - Show all color options
5. **States** - Loading, disabled, error, etc.
6. **With Content** - With icons, complex children, etc.
7. **Real-World** - Realistic usage example in context

### Compound Components

**✅ DO** create separate stories for each sub-component:

```typescript
// card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from './card';
import { Button } from './button';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Show basic card
export const Basic: Story = {
  render: () => (
    <Card>
      <CardContent>
        <p>Simple card content</p>
      </CardContent>
    </Card>
  ),
};

// Show all sub-components
export const Complete: Story = {
  render: () => (
    <Card elevated>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>Review your taco order before submitting</CardDescription>
      </CardHeader>
      <CardContent>
        <p>3 Beef Tacos - $15.99</p>
        <p>2 Chicken Tacos - $12.99</p>
      </CardContent>
      <CardFooter className="justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button>Submit Order</Button>
      </CardFooter>
    </Card>
  ),
};

// Show elevated variant
export const Elevated: Story = {
  render: () => (
    <Card elevated>
      <CardContent>
        <p>Card with elevation shadow</p>
      </CardContent>
    </Card>
  ),
};
```

### Documentation Checklist

Before considering a component complete, verify:

- [ ] **JSDoc comments** added to component function
- [ ] **@param** documented for all non-obvious props
- [ ] **@example** section with code examples
- [ ] **Storybook story file** created (`*.stories.tsx`)
- [ ] **Default story** showing basic usage
- [ ] **Variants story** showing all variant options
- [ ] **States stories** (loading, disabled, error, etc.)
- [ ] **Real-world story** showing realistic usage
- [ ] **Controls** configured in Storybook for interactive testing
- [ ] **Descriptions** added to argTypes
- [ ] **Component description** in meta.parameters.docs

### Why This Matters

**Documentation + Storybook = Essential** because:
- ✅ **Discoverability** - Developers can find and understand components
- ✅ **Consistency** - Everyone uses components the same way
- ✅ **Visual Testing** - Catch visual regressions
- ✅ **Design Review** - Designers can review components
- ✅ **Interactive Playground** - Test all variants without writing code
- ✅ **Living Documentation** - Always up-to-date with code
- ✅ **Onboarding** - New developers learn faster

**No exceptions**: If a component doesn't have docs + Storybook, it's **not ready for production**.

---

## Design System

### Design Tokens

**File**: `tokens.ts`

**✅ DO** define all design tokens centrally:

```typescript
// tokens.ts

// Border radius
export const radius = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  full: 'rounded-full',
} as const;

// Backgrounds
export const backgrounds = {
  card: 'bg-slate-900/70',
  input: 'bg-slate-950/60',
  hover: 'bg-slate-800/60',
  overlay: 'bg-slate-950/80',
  elevated: 'bg-white',
} as const;

// Borders
export const borders = {
  default: 'border-slate-200',
  muted: 'border-slate-100',
  accent: 'border-brand-400/50',
  error: 'border-rose-500',
} as const;

// Shadows
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  none: 'shadow-none',
} as const;

// Text colors
export const textColors = {
  primary: 'text-slate-900',
  secondary: 'text-slate-600',
  muted: 'text-slate-500',
  inverse: 'text-white',
  brand: 'text-brand-500',
  error: 'text-rose-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
} as const;

// Spacing (for consistent gaps, padding)
export const spacing = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
} as const;
```

**Usage**:

```typescript
import { radius, backgrounds, shadows, textColors } from '@tacocrew/ui-kit';

<Card className={cn(radius.md, backgrounds.card, shadows.lg)}>
  <h2 className={textColors.primary}>Title</h2>
  <p className={textColors.secondary}>Description</p>
</Card>
```

### Color Palette

**Semantic colors**:
- **Brand**: `brand-*` - Primary brand color (indigo/blue)
- **Success**: `emerald-*` - Success states
- **Error**: `rose-*` - Error states
- **Warning**: `amber-*` - Warning states
- **Neutral**: `slate-*` - Grays for text and backgrounds

**Special colors**:
- **brandHero**: Hero gradient for avatars

**Opacity scale**:
- `/10` - 10% opacity
- `/20` - 20% opacity
- `/50` - 50% opacity
- `/60` - 60% opacity
- `/70` - 70% opacity
- `/80` - 80% opacity

### Base Components

**File**: `base.tsx`

**✅ DO** create base components for internal use:

```typescript
// base.tsx
import type { HTMLAttributes } from 'react';
import { cn } from './utils';

// Base container with consistent spacing
type BaseContainerProps = HTMLAttributes<HTMLDivElement> & {
  readonly size?: 'sm' | 'md' | 'lg';
};

export function BaseContainer({ size = 'md', className, ...props }: BaseContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        size === 'sm' && 'max-w-screen-sm',
        size === 'md' && 'max-w-screen-md',
        size === 'lg' && 'max-w-screen-lg',
        className
      )}
      {...props}
    />
  );
}

// Base text with consistent styling
type BaseTextProps = HTMLAttributes<HTMLParagraphElement> & {
  readonly size?: 'sm' | 'md' | 'lg';
};

export function BaseText({ size = 'md', className, ...props }: BaseTextProps) {
  return (
    <p
      className={cn(
        'text-slate-700',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-lg',
        className
      )}
      {...props}
    />
  );
}
```

---

## Styling Conventions

### Tailwind Class Organization

**✅ DO** organize classes logically:

```typescript
<button
  className={cn(
    // Layout
    'inline-flex items-center justify-center gap-2',
    // Sizing
    'h-11 px-5',
    // Typography
    'text-sm font-semibold',
    // Colors
    'bg-brand-500 text-white',
    // Borders
    'border border-brand-400/50 rounded-xl',
    // Effects
    'shadow-sm transition-all',
    // Hover states
    'hover:bg-brand-600 hover:shadow-md',
    // Focus states
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
    // Disabled states
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // User classes (override)
    className
  )}
>
  {children}
</button>
```

### Using `cn()` Utility

**✅ DO** use `cn()` for class merging:

```typescript
import { cn } from './utils';

// cn() automatically handles:
// 1. Filtering falsy values
// 2. Merging conflicting Tailwind classes

<div
  className={cn(
    'bg-red-500',    // Base background
    'bg-blue-500',   // This wins (last class)
    false && 'hidden', // Filtered out
    isActive && 'font-bold', // Conditional
    className        // User override
  )}
/>
```

**Implementation**:

```typescript
// utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Responsive Variants

**✅ DO** define responsive variants:

```typescript
export const avatarVariants = cva('relative inline-flex shrink-0 overflow-hidden', {
  variants: {
    size: {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Usage with responsive sizing
<Avatar className="size-8 md:size-10 lg:size-12" />
```

### Dark Mode Support (Future)

**✅ DO** prepare for dark mode with semantic colors:

```typescript
// Instead of hardcoded colors
<div className="bg-white text-slate-900"> // Hard to adapt

// Use semantic naming
<div className="bg-card text-foreground"> // Easy to theme
```

---

## Radix UI Integration

### When to Use Radix UI

**✅ DO** use Radix for complex interactive components:

- **Dropdowns**: `@radix-ui/react-dropdown-menu`
- **Modals/Dialogs**: `@radix-ui/react-dialog`
- **Tooltips**: `@radix-ui/react-tooltip`
- **Select**: `@radix-ui/react-select`
- **Checkbox**: `@radix-ui/react-checkbox`
- **Tabs**: `@radix-ui/react-tabs`
- **Accordion**: `@radix-ui/react-accordion`

**❌ DON'T** use Radix for simple components:

- Buttons (use native `<button>`)
- Cards (use native `<div>`)
- Basic inputs (use native `<input>`)

### Customizing Radix Components

**✅ DO** wrap Radix primitives with custom styling:

```typescript
// tooltip.tsx
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from './utils';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

type TooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;

export function TooltipContent({ className, sideOffset = 4, ...props }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-lg border border-slate-200',
        'bg-white px-3 py-1.5 text-sm text-slate-950 shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        className
      )}
      {...props}
    />
  );
}
```

**Usage**:

```typescript
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@tacocrew/ui-kit';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Helpful information</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Accessibility Considerations

**✅ DO** preserve Radix accessibility features:

```typescript
// Radix provides built-in:
// - Keyboard navigation
// - Focus management
// - ARIA attributes
// - Screen reader support

// Don't override these unless necessary
<TooltipPrimitive.Content
  // Keep Radix props
  side="top"
  align="center"
  sideOffset={4}
  // Add custom styling
  className="custom-styles"
/>
```

---

## Exports

### Barrel Export Pattern

**File**: `index.ts`

**✅ DO** export all public components:

```typescript
// index.ts

// Design tokens
export * from './tokens';
export * from './variants';
export * from './utils';

// Base components
export * from './base';

// UI components
export * from './alert';
export * from './avatar';
export * from './badge';
export * from './button';
export * from './card';
export * from './checkbox';
export * from './date-time-picker';
export * from './divider';
export * from './dropdown-menu';
export * from './empty-state';
export * from './input';
export * from './input-group';
export * from './label';
export * from './modal';
export * from './phone-input';
export * from './select';
export * from './segmented-control';
export * from './skeleton';
export * from './status-badge';
export * from './textarea';
export * from './tooltip';

// Third-party re-exports
export { toast, Toaster } from 'sonner';

// Types
export type { ClassValue } from 'clsx';
```

### Component Re-exports

**✅ DO** re-export compound components individually:

```typescript
// card.tsx
export { Card } from './Card';
export { CardHeader } from './CardHeader';
export { CardTitle } from './CardTitle';
export { CardDescription } from './CardDescription';
export { CardContent } from './CardContent';
export { CardFooter } from './CardFooter';
```

### Type Exports

**✅ DO** export component prop types for consumers:

```typescript
// button.tsx
export type { ButtonProps } from './Button';

// Usage in consuming app
import type { ButtonProps } from '@tacocrew/ui-kit';

type CustomButtonProps = ButtonProps & {
  readonly customProp: string;
};
```

---

## Testing Guidelines

### Component Unit Tests

**✅ DO** test component rendering and variants:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should apply variant classes', () => {
    render(<Button variant="outline" color="brand">Submit</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-brand-400');
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Click</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
```

### Visual Regression Testing (Storybook)

**✅ DO** create stories for all variants:

```typescript
// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    color: 'brand',
    children: 'Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    color: 'brand',
    children: 'Button',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

### Accessibility Testing

**✅ DO** test keyboard navigation and ARIA:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';

describe('Tooltip accessibility', () => {
  it('should show tooltip on hover', async () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByText('Hover me');
    await userEvent.hover(trigger);

    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByText('Trigger');
    expect(trigger).toHaveAttribute('aria-describedby');
  });
});
```

---

## Code Review Checklist

### Component Quality
- [ ] Component follows template structure
- [ ] Props extend base HTML element types
- [ ] All props marked as `readonly`
- [ ] Refs forwarded for form components
- [ ] `displayName` set for components using `forwardRef`

### Variants
- [ ] Variants defined in `variants.ts`
- [ ] CVA used for variant management
- [ ] Default variants specified
- [ ] Compound variants for combinations

### Styling
- [ ] `cn()` utility used for class merging
- [ ] Classes organized logically
- [ ] Design tokens used where possible
- [ ] No hardcoded colors (use semantic colors)
- [ ] Responsive variants defined

### Accessibility
- [ ] Radix UI used for complex components
- [ ] ARIA attributes preserved
- [ ] Keyboard navigation tested
- [ ] Focus states styled

### Exports
- [ ] Component exported from `index.ts`
- [ ] Prop types exported
- [ ] Sub-components exported individually

### Testing
- [ ] Unit tests for component logic
- [ ] Storybook stories for all variants
- [ ] Accessibility tests included

### Documentation & Storybook (REQUIRED)
- [ ] **JSDoc comments** added to component function
- [ ] **@param** documented for all non-obvious props
- [ ] **@example** section with usage examples
- [ ] **Storybook story file** created (`*.stories.tsx`)
- [ ] **Default/Primary story** present
- [ ] **All Variants story** showing all options
- [ ] **All Sizes story** (if applicable)
- [ ] **All Colors story** (if applicable)
- [ ] **States stories** (loading, disabled, error, etc.)
- [ ] **Real-world story** with realistic usage
- [ ] **Controls configured** in argTypes
- [ ] **Component description** in meta.parameters.docs
- [ ] **All compound sub-components** have stories

---

## Resources

- [Radix UI Documentation](https://www.radix-ui.com/)
- [CVA Documentation](https://cva.style/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Storybook Documentation](https://storybook.js.org/docs)

---

**Next**: See [Web App Guidelines](../../apps/web/GUIDELINES.md) for consuming these components.
