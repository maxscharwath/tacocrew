import { Slot } from '@radix-ui/react-slot';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { Separator } from './separator';
import { cn } from './utils';

const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  }
);

/**
 * ButtonGroup container component for grouping related buttons together.
 * Supports both horizontal and vertical orientations.
 *
 * @param orientation - The layout direction: "horizontal" or "vertical"
 * @param className - Additional CSS classes to apply
 * @param children - Button elements or other interactive controls to group
 *
 * @example
 * ```tsx
 * // Horizontal button group
 * <ButtonGroup>
 *   <Button variant="outline">Left</Button>
 *   <Button variant="outline">Middle</Button>
 *   <Button variant="outline">Right</Button>
 * </ButtonGroup>
 *
 * // Vertical button group
 * <ButtonGroup orientation="vertical">
 *   <Button variant="outline">Top</Button>
 *   <Button variant="outline">Middle</Button>
 *   <Button variant="outline">Bottom</Button>
 * </ButtonGroup>
 *
 * // With separator
 * <ButtonGroup>
 *   <Button variant="outline">Copy</Button>
 *   <ButtonGroupSeparator />
 *   <Button variant="outline">Paste</Button>
 * </ButtonGroup>
 * ```
 *
 * @see {@link ButtonGroupText}
 * @see {@link ButtonGroupSeparator}
 */
export function ButtonGroup({
  className,
  orientation,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

/**
 * ButtonGroupText component for displaying static text or labels within a ButtonGroup.
 * Can be used as a label or to show contextual information between buttons.
 *
 * @param asChild - Whether to use the Slot component to merge props with child element
 * @param className - Additional CSS classes to apply
 * @param children - Text content or elements to display
 *
 * @example
 * ```tsx
 * // As a label
 * <ButtonGroup>
 *   <ButtonGroupText>Sort by:</ButtonGroupText>
 *   <Button variant="outline">Name</Button>
 *   <Button variant="outline">Date</Button>
 * </ButtonGroup>
 *
 * // With icon
 * <ButtonGroup>
 *   <ButtonGroupText>
 *     <FilterIcon />
 *     Filter
 *   </ButtonGroupText>
 *   <Button variant="outline">Active</Button>
 * </ButtonGroup>
 * ```
 */
export function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: ComponentProps<'div'> & {
  readonly asChild?: boolean;
}) {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      className={cn(
        'flex items-center gap-2 rounded-md border border-gray-700 bg-slate-900/50 px-4 text-sm font-medium text-white shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4',
        className
      )}
      {...props}
    />
  );
}

/**
 * ButtonGroupSeparator component for adding visual separation between buttons in a ButtonGroup.
 * Uses the Separator component internally with appropriate styling for button groups.
 *
 * @param orientation - The orientation of the separator: "horizontal" or "vertical" (defaults to "vertical")
 * @param className - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * // Vertical separator in horizontal button group
 * <ButtonGroup>
 *   <Button variant="outline">Bold</Button>
 *   <Button variant="outline">Italic</Button>
 *   <ButtonGroupSeparator />
 *   <Button variant="outline">Underline</Button>
 * </ButtonGroup>
 *
 * // Horizontal separator in vertical button group
 * <ButtonGroup orientation="vertical">
 *   <Button variant="outline">Top</Button>
 *   <ButtonGroupSeparator orientation="horizontal" />
 *   <Button variant="outline">Bottom</Button>
 * </ButtonGroup>
 * ```
 *
 * @see {@link Separator}
 */
export function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        'bg-white/10 relative !m-0 self-stretch data-[orientation=vertical]:h-auto',
        className
      )}
      {...props}
    />
  );
}

export { buttonGroupVariants };
