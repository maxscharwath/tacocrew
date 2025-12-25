/**
 * Form validation and submission error types
 * Structured error handling for form operations
 */

export enum FormErrorCode {
  // Validation errors
  MISSING_REQUIRED = 'MISSING_REQUIRED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',

  // Field-specific errors
  INVALID_TACO_SIZE = 'INVALID_TACO_SIZE',
  INVALID_MEAT_SELECTION = 'INVALID_MEAT_SELECTION',
  INVALID_SAUCE_SELECTION = 'INVALID_SAUCE_SELECTION',
  INVALID_GARNITURE_SELECTION = 'INVALID_GARNITURE_SELECTION',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',

  // Submission errors
  SUBMISSION_FAILED = 'SUBMISSION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',

  // State errors
  INVALID_STATE = 'INVALID_STATE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export type FormField =
  | 'general'
  | 'tacoSize'
  | 'meats'
  | 'sauces'
  | 'garnitures'
  | 'extras'
  | 'drinks'
  | 'desserts'
  | 'note';

export interface FormError {
  code: FormErrorCode;
  message: string;
  field?: FormField;
  context?: Record<string, unknown>;
  originalError?: Error;
}

/**
 * Factory for creating structured form errors
 */
export const FormErrorFactory = {
  missingRequired: (field: FormField, message?: string): FormError => ({
    code: FormErrorCode.MISSING_REQUIRED,
    message: message || `${field} is required`,
    field,
  }),

  invalidFormat: (field: FormField, message?: string): FormError => ({
    code: FormErrorCode.INVALID_FORMAT,
    message: message || `${field} has invalid format`,
    field,
  }),

  outOfRange: (field: FormField, min?: number, max?: number): FormError => ({
    code: FormErrorCode.OUT_OF_RANGE,
    message: `${field} must be between ${min} and ${max}`,
    field,
    context: { min, max },
  }),

  businessRuleViolation: (
    message: string,
    field?: FormField,
    context?: Record<string, unknown>
  ): FormError => ({
    code: FormErrorCode.BUSINESS_RULE_VIOLATION,
    message,
    field,
    context,
  }),

  invalidTacoSize: (size: string): FormError => ({
    code: FormErrorCode.INVALID_TACO_SIZE,
    message: `Invalid taco size: ${size}`,
    field: 'tacoSize',
    context: { size },
  }),

  invalidMeatSelection: (message?: string): FormError => ({
    code: FormErrorCode.INVALID_MEAT_SELECTION,
    message: message || 'Invalid meat selection',
    field: 'meats',
  }),

  invalidSauceSelection: (message?: string): FormError => ({
    code: FormErrorCode.INVALID_SAUCE_SELECTION,
    message: message || 'Invalid sauce selection',
    field: 'sauces',
  }),

  invalidGarnitureSelection: (message?: string): FormError => ({
    code: FormErrorCode.INVALID_GARNITURE_SELECTION,
    message: message || 'Garnitures are not available for this taco size',
    field: 'garnitures',
  }),

  insufficientStock: (itemName: string): FormError => ({
    code: FormErrorCode.INSUFFICIENT_STOCK,
    message: `${itemName} is out of stock`,
    context: { itemName },
  }),

  submissionFailed: (message: string, originalError?: Error): FormError => ({
    code: FormErrorCode.SUBMISSION_FAILED,
    message,
    originalError,
  }),

  networkError: (originalError: Error): FormError => ({
    code: FormErrorCode.NETWORK_ERROR,
    message: `Network error: ${originalError.message}`,
    originalError,
  }),

  serverError: (status: number, message?: string): FormError => ({
    code: FormErrorCode.SERVER_ERROR,
    message: message || `Server error (${status})`,
    context: { status },
  }),

  invalidState: (message: string, context?: Record<string, unknown>): FormError => ({
    code: FormErrorCode.INVALID_STATE,
    message,
    context,
  }),

  unknown: (originalError: Error, field?: FormField): FormError => ({
    code: FormErrorCode.UNKNOWN_ERROR,
    message: `Unknown error: ${originalError.message}`,
    field,
    originalError,
  }),
};
