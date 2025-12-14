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
  readonly children: (field: ControllerRenderProps<T, FieldPath<T>>) => ReactNode;
  readonly disabled?: boolean;
}

/**
 * Reusable form field component that wraps react-hook-form's Controller
 * Reduces boilerplate by handling Field, Label, and Error rendering
 *
 * @example
 * ```tsx
 * <FormField
 *   name="email"
 *   control={form.control}
 *   label="Email address"
 *   required
 * >
 *   {(field) => <Input {...field} type="email" placeholder="you@example.com" />}
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
          {children(field)}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
      disabled={disabled}
    />
  );
}
