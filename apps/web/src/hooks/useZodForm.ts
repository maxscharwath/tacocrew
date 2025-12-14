import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { type UseFormProps, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

/**
 * Custom hook that wraps useForm with automatic i18n error translation
 * Translates validation keys (e.g., "validation.required") to localized messages
 *
 * @example
 * ```tsx
 * const form = useZodForm({
 *   schema: mySchema,
 *   defaultValues: { ... },
 * });
 * ```
 */
export function useZodForm<TSchema extends z.ZodObject<z.ZodRawShape>>({
  schema,
  ...formProps
}: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'> & {
  readonly schema: TSchema;
}) {
  const { t } = useTranslation();

  const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && !Array.isArray(value) && value instanceof Object;
  };

  const isString = (value: unknown): value is string => {
    return value !== null && value !== undefined && (value as string).constructor === String;
  };

  const translateErrors = (obj: Record<string, unknown>): void => {
    if ('message' in obj && isString(obj.message)) {
      obj.message = t(obj.message);
    }

    for (const value of Object.values(obj)) {
      if (isRecord(value)) {
        translateErrors(value);
      }
    }
  };

  const form = useForm({
    ...formProps,
    resolver: zodResolver(schema),
  });

  // Translate errors whenever formState.errors changes
  useEffect(() => {
    if (form.formState.errors && isRecord(form.formState.errors)) {
      translateErrors(form.formState.errors);
    }
  }, [form.formState.errors, t]);

  return form;
}
