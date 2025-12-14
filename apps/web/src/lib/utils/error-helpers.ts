import { ApiError } from '@/lib/api/http';

/**
 * Check if error is about multiple organizations requiring selection
 */
export function isMultipleOrganizationsError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  if (error.errorCode !== 'VALIDATION_ERROR') {
    return false;
  }
  if (!error.details || Array.isArray(error.details)) {
    return false;
  }
  const isString = (value: unknown): value is string => {
    return value !== null && value !== undefined && (value as string).constructor === String;
  };
  if (!('message' in error.details) || !isString(error.details.message)) {
    return false;
  }
  return error.details.message.includes('multiple organizations');
}

/**
 * Extract error message from ApiError details
 */
export function extractErrorMessage(error: unknown): string | undefined {
  const isString = (value: unknown): value is string => {
    return value !== null && value !== undefined && (value as string).constructor === String;
  };
  if (
    error instanceof ApiError &&
    error.details &&
    !Array.isArray(error.details) &&
    'message' in error.details &&
    isString(error.details.message)
  ) {
    return error.details.message;
  }
  return undefined;
}
