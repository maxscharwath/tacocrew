import type { TFunction } from 'i18next';
import { ApiError } from '../api/http';

/**
 * Get translated error message from ApiError
 * Uses the error's key for i18n translation and details for interpolation
 */
export function getTranslatedErrorMessage(error: ApiError, t: TFunction): string {
  // If error has a key, use it for translation with details as interpolation variables
  if (error.key) {
    try {
      // For NotFoundError, use normalized details with context
      if (error.key === 'errors.notFound.generic' && error.details) {
        const { resource, identifier, context } = error.details;

        // Type guard for string values
        const getString = (value: unknown): string | undefined => {
          return typeof value === 'string' ? value : undefined;
        };

        return t(error.key, {
          context: getString(context),
          resource: getString(resource) || t('errors.notFound.resource'),
          identifier: getString(identifier) || '',
        });
      }
      return t(error.key, error.details || {});
    } catch {
      // If translation fails, fall back to message
    }
  }

  // Fall back to error message if no key or translation fails
  return error.message || 'An unexpected error occurred';
}
