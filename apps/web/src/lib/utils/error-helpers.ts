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
  if (!error.details || typeof error.details !== 'object') {
    return false;
  }
  if (!('message' in error.details) || typeof error.details.message !== 'string') {
    return false;
  }
  return error.details.message.includes('multiple organizations');
}

/**
 * Extract error message from ApiError details
 */
export function extractErrorMessage(error: unknown): string | undefined {
  if (
    error instanceof ApiError &&
    error.details &&
    typeof error.details === 'object' &&
    'message' in error.details &&
    typeof error.details.message === 'string'
  ) {
    return error.details.message;
  }
  return undefined;
}
