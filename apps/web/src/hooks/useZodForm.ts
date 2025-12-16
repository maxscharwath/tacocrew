import { zodResolver } from '@hookform/resolvers/zod';
import { type Resolver, type UseFormProps, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

/**
 * Recursively translates validation error messages from i18n keys to localized text
 * @param obj - Error object (potentially nested)
 * @param t - i18n translation function
 * @returns Translated error object
 */
function translateErrors(obj: unknown, t: (key: string) => string): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  const errorObj = obj as Record<string, unknown>;

  // If this object has a message property, translate it
  if ('message' in errorObj && typeof errorObj.message === 'string') {
    return { ...errorObj, message: t(errorObj.message) };
  }

  // Recursively translate nested error objects
  const translated: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(errorObj)) {
    translated[key] = translateErrors(value, t);
  }
  return translated;
}

/**
 * Custom hook that wraps useForm with Zod validation and automatic i18n translation
 *
 * Validation error messages are automatically translated from keys (e.g., 'validation.required')
 * to localized text based on the current language.
 *
 * @example
 * ```tsx
 * const form = useZodForm({
 *   schema: loginSchema,
 *   defaultValues: { email: '', password: '' },
 * });
 * ```
 */
export function useZodForm<TSchema extends z.ZodObject<z.ZodRawShape>>({
  schema,
  ...formProps
}: Omit<UseFormProps<z.input<TSchema>>, 'resolver'> & {
  readonly schema: TSchema;
}) {
  const { t } = useTranslation();
  return useForm({
    ...formProps,
    resolver: (async (values, context, options) => {
      const result = await zodResolver(schema)(values, context, options);

      if (result.errors && Object.keys(result.errors).length > 0) {
        return { ...result, errors: translateErrors(result.errors, t) };
      }

      return result;
    }) as Resolver<z.input<TSchema>>,
  });
}
