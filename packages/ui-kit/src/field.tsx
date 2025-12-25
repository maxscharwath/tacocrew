import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import type { FieldError as RHFFieldError } from 'react-hook-form';
import { cn } from './utils';

/**
 * FieldGroup - Groups multiple fields together with consistent spacing
 *
 * @example
 * ```tsx
 * <FieldGroup>
 *   <Field>
 *     <FieldLabel>Name</FieldLabel>
 *     <Input />
 *   </Field>
 *   <Field>
 *     <FieldLabel>Email</FieldLabel>
 *     <Input type="email" />
 *   </Field>
 * </FieldGroup>
 * ```
 */
function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn('flex flex-col gap-6', className)}
      {...props}
    />
  );
}

const fieldVariants = cva('flex w-full gap-2', {
  variants: {
    orientation: {
      vertical: 'flex-col',
      horizontal: 'flex-row items-center justify-between',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

/**
 * Field - Wrapper for a single form field with label, input, description, and error
 *
 * @example
 * ```tsx
 * <Field>
 *   <FieldLabel htmlFor="email">Email</FieldLabel>
 *   <Input id="email" type="email" />
 *   <FieldDescription>We'll never share your email.</FieldDescription>
 *   <FieldError errors={[error]} />
 * </Field>
 * ```
 */
function Field({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      data-slot="field"
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

/**
 * FieldLabel - Label for a form field
 *
 * @example
 * ```tsx
 * <FieldLabel htmlFor="name">Full Name</FieldLabel>
 * ```
 */
function FieldLabel({
  className,
  required,
  children,
  ...props
}: ComponentProps<'label'> & Readonly<{ required?: boolean }>) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        'font-semibold text-slate-400 text-xs uppercase tracking-[0.25em]',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-rose-400">*</span>}
    </label>
  );
}

/**
 * FieldDescription - Helper text for a form field
 *
 * @example
 * ```tsx
 * <FieldDescription>
 *   Your password must be at least 8 characters.
 * </FieldDescription>
 * ```
 */
function FieldDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-xs text-slate-400 leading-relaxed', className)}
      {...props}
    />
  );
}

/**
 * FieldError - Error message for a form field
 *
 * Accepts an array of React Hook Form FieldError objects or a single error.
 *
 * @example
 * ```tsx
 * // With RHF Controller
 * <Controller
 *   name="email"
 *   control={form.control}
 *   render={({ field, fieldState }) => (
 *     <Field data-invalid={fieldState.invalid}>
 *       <FieldLabel>Email</FieldLabel>
 *       <Input {...field} aria-invalid={fieldState.invalid} />
 *       {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
 *     </Field>
 *   )}
 * />
 * ```
 */
function FieldError({
  className,
  errors,
  ...props
}: Omit<ComponentProps<'p'>, 'children'> &
  Readonly<{
    errors?: readonly (RHFFieldError | undefined)[];
  }>) {
  const validErrors = errors?.filter(
    (error): error is RHFFieldError => error !== undefined
  );

  if (!validErrors || validErrors.length === 0) {
    return null;
  }

  return (
    <div
      data-slot="field-error"
      className={cn('flex flex-col gap-1', className)}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {validErrors.map((error, index) => (
        <p
          key={error.message ?? index}
          className="text-xs font-medium text-rose-400"
        >
          {error.message}
        </p>
      ))}
    </div>
  );
}

export { Field, FieldGroup, FieldLabel, FieldDescription, FieldError };
