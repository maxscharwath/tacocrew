import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from './utils';

/**
 * Accordion root component for creating collapsible content sections.
 * Built on Radix UI for accessibility and keyboard navigation.
 *
 * @example
 * ```tsx
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>What is TacoCrew?</AccordionTrigger>
 *     <AccordionContent>
 *       TacoCrew is a taco ordering platform...
 *     </AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 *
 * @see {@link AccordionItem}
 * @see {@link AccordionTrigger}
 * @see {@link AccordionContent}
 */
export function Accordion({
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

/**
 * Individual accordion item container.
 * Must be used within an Accordion component.
 *
 * @param className - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * <AccordionItem value="faq-1">
 *   <AccordionTrigger>Question</AccordionTrigger>
 *   <AccordionContent>Answer</AccordionContent>
 * </AccordionItem>
 * ```
 */
export function AccordionItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b last:border-b-0', className)}
      {...props}
    />
  );
}

/**
 * Accordion trigger button that toggles content visibility.
 * Automatically includes a chevron icon that rotates on open/close.
 *
 * @param className - Additional CSS classes to apply
 * @param children - Trigger label/content (chevron is automatically appended)
 *
 * @example
 * ```tsx
 * <AccordionTrigger>Click to expand</AccordionTrigger>
 * ```
 */
export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/**
 * Accordion content that expands/collapses when trigger is clicked.
 * Includes smooth animation for opening and closing.
 *
 * @param className - Additional CSS classes to apply
 * @param children - Content to display when expanded
 *
 * @example
 * ```tsx
 * <AccordionContent>
 *   <p>This content appears when the accordion is expanded.</p>
 * </AccordionContent>
 * ```
 */
export function AccordionContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn('pt-0 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
