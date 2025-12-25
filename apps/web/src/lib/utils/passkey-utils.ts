/**
 * Passkey (WebAuthn) utilities
 * Handles WebAuthn support detection and error handling
 */

/**
 * Check if WebAuthn is supported in the browser
 */
export function isWebAuthnSupported(): boolean {
  return !!globalThis.PublicKeyCredential;
}

/**
 * Check if error is a WebAuthn cancellation
 */
export function isPasskeyCancellationError(error: unknown): boolean {
  return !!(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'AUTH_CANCELLED'
  );
}

/**
 * Extract error message from passkey error
 */
export function getPasskeyErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (typeof error === 'object' && 'message' in error) {
    return error.message as string;
  }

  return null;
}

/**
 * Check if error is a WebAuthn timeout
 */
export function isPasskeyTimeoutError(error: unknown): boolean {
  return !!(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'NotAllowedError'
  );
}
