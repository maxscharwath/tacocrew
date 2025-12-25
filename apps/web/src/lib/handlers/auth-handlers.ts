/**
 * Authentication handlers
 * Consolidated authentication logic for email/password and passkey flows
 */

import { authClient } from '@/lib/auth-client';
import type { LoginFormData, SignupFormData } from '@/lib/schemas';
import {
  getPasskeyErrorMessage,
  isPasskeyCancellationError,
  isWebAuthnSupported,
} from '@/lib/utils/passkey-utils';

interface AuthHandlerCallbacks {
  onSuccess: () => void;
  onError: (message: string) => void;
  onLoading: (loading: boolean) => void;
}

/**
 * Handle email/password authentication (sign in or sign up)
 */
export async function handleEmailPasswordAuth(
  data: LoginFormData | SignupFormData,
  isSignUp: boolean,
  callbacks: AuthHandlerCallbacks,
  t: (key: string) => string
): Promise<void> {
  callbacks.onLoading(true);

  try {
    if (isSignUp) {
      const signupData = data as SignupFormData;
      const result = await authClient.signUp.email({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name || '',
      });

      if (result.error) {
        callbacks.onError(result.error.message || t('login.signUpFailed'));
        return;
      }
    } else {
      const result = await authClient.signIn.email(data as LoginFormData);

      if (result.error) {
        callbacks.onError(result.error.message || t('login.signInFailed'));
        return;
      }
    }

    callbacks.onSuccess();
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : t('login.unexpectedError'));
  } finally {
    callbacks.onLoading(false);
  }
}

/**
 * Attempt passkey sign in with autoFill option
 */
async function attemptPasskeySignIn(
  useAutoFill: boolean,
  callbacks: {
    onSuccess: () => void;
    onError: (message: string) => void;
  }
): Promise<boolean> {
  try {
    const result = await authClient.signIn.passkey({
      autoFill: useAutoFill,
      fetchOptions: {
        onSuccess: callbacks.onSuccess,
        onError: (ctx) => {
          if (!isPasskeyCancellationError(ctx.error)) {
            const message = getPasskeyErrorMessage(ctx.error);
            if (message) {
              callbacks.onError(message);
            }
          }
        },
      },
    });

    // Handle result if callbacks didn't fire
    if (result?.error) {
      if (isPasskeyCancellationError(result.error)) {
        return false;
      }

      const message = getPasskeyErrorMessage(result.error);
      if (message) {
        callbacks.onError(message);
      }
      return false;
    }

    if (result?.data) {
      callbacks.onSuccess();
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Handle passkey sign in with fallback to manual selection
 */
export async function handlePasskeySignIn(
  callbacks: AuthHandlerCallbacks,
  t: (key: string) => string
): Promise<void> {
  callbacks.onLoading(true);

  // Check if WebAuthn is supported
  if (!isWebAuthnSupported()) {
    callbacks.onError(
      'Passkeys are not supported in this browser. Please use a modern browser that supports WebAuthn.'
    );
    callbacks.onLoading(false);
    return;
  }

  try {
    // First try with autoFill
    const success = await attemptPasskeySignIn(true, {
      onSuccess: callbacks.onSuccess,
      onError: callbacks.onError,
    });

    // If autoFill was cancelled, try without autoFill
    if (!success) {
      const retrySuccess = await attemptPasskeySignIn(false, {
        onSuccess: callbacks.onSuccess,
        onError: callbacks.onError,
      });

      if (!retrySuccess) {
        callbacks.onError(
          'Passkey sign-in was cancelled. Please try again and select your passkey when prompted.'
        );
        callbacks.onLoading(false);
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : t('login.passkeyAuthFailed'));
    callbacks.onLoading(false);
  }
}
