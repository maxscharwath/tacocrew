import { Field, FieldError, FieldLabel } from '@tacocrew/ui-kit';
import type { ReactNode } from 'react';
import {
  type Control,
  Controller,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
  readonly label?: string;
  readonly required?: boolean;
  readonly children: (
    field: ControllerRenderProps<T, FieldPath<T>>,
    fieldState: { invalid: boolean; error?: { message?: string } }
  ) => ReactNode;
  readonly disabled?: boolean;
}

/**
 * Reusable form field component that wraps react-hook-form's Controller
 * Reduces boilerplate by handling Field, Label, and Error rendering
 * Error messages are automatically translated via the error map in useZodForm
 *
 * @example
 * ```tsx
 * <FormField
 *   name="email"
 *   control={form.control}
 *   label="Email address"
 *   required
 * >
 *   {(field, fieldState) => (
 *     <Input
 *       {...field}
 *       type="email"
 *       placeholder="you@example.com"
 *       aria-invalid={fieldState.invalid}
 *     />
 *   )}
 * </FormField>
 * ```
 */
export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  required,
  children,
  disabled,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          {label && (
            <FieldLabel htmlFor={name} required={required}>
              {label}
            </FieldLabel>
          )}
          {children(field, { invalid: fieldState.invalid, error: fieldState.error })}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
      disabled={disabled}
    />
  );
}
