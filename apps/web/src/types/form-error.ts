/**
 * Form error types
 * Represents errors that occur during form operations
 */

export type FormErrorCode =
  | 'VALIDATION_ERROR'
  | 'SUBMISSION_ERROR'
  | 'NETWORK_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN_ERROR';

export interface FormError {
  code: FormErrorCode;
  message: string;
  field?: FormField;
  originalError?: Error;
}

export type FormField =
  | 'tacoSize'
  | 'meats'
  | 'sauces'
  | 'garnitures'
  | 'extras'
  | 'drinks'
  | 'desserts'
  | 'general';

/**
 * Error factory functions
 */
export const FormErrorFactory = {
  validation: (field: FormField, message: string): FormError => ({
    code: 'VALIDATION_ERROR',
    message,
    field,
  }),

  submission: (message: string, originalError?: Error): FormError => ({
    code: 'SUBMISSION_ERROR',
    message,
    originalError,
  }),

  network: (message: string, originalError?: Error): FormError => ({
    code: 'NETWORK_ERROR',
    message,
    originalError,
  }),

  notFound: (message: string): FormError => ({
    code: 'NOT_FOUND',
    message,
  }),

  unknown: (originalError?: Error): FormError => ({
    code: 'UNKNOWN_ERROR',
    message: originalError?.message ?? 'An unexpected error occurred',
    originalError,
  }),
};
