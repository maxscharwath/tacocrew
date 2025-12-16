import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type { ComponentPropsWithoutRef, ComponentRef } from 'react';
import { forwardRef } from 'react';
import { cn } from './utils';

/**
 * Separator component for visually or semantically separating content.
 * Built on Radix UI Separator primitive for accessibility.
 *
 * @param orientation - The orientation of the separator: "horizontal" or "vertical"
 * @param decorative - Whether the separator is purely decorative (no semantic meaning)
 * @param className - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * // Horizontal separator
 * <Separator />
 *
 * // Vertical separator
 * <div className="flex h-5 items-center">
 *   <span>Item 1</span>
 *   <Separator orientation="vertical" className="mx-2" />
 *   <span>Item 2</span>
 * </div>
 *
 * // Decorative separator
 * <Separator decorative />
 * ```
 *
 * @see {@link https://www.radix-ui.com/docs/primitives/components/separator}
 */
export const Separator = forwardRef<
  ComponentRef<typeof SeparatorPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className
      )}
      {...props}
    />
  )
);

Separator.displayName = SeparatorPrimitive.Root.displayName;
