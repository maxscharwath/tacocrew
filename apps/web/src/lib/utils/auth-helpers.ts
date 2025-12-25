/**
 * Authentication helper utilities
 * Utilities for auth flow, UI text, and form configuration
 */

import type { LoginFormData } from '@/lib/schemas';
import { loginSchema, type SignupFormData, signupSchema } from '@/lib/schemas';

/**
 * Get submit button text based on loading and signup state
 */
export function getSubmitButtonText(
  isLoading: boolean,
  isSignUp: boolean,
  t: (key: string) => string
): string {
  if (isLoading) return t('login.pleaseWait');
  if (isSignUp) return t('login.signUpButton');
  return t('login.signIn');
}

/**
 * Get form schema based on signup flag
 */
export function getFormSchema(isSignUp: boolean) {
  return isSignUp ? signupSchema : loginSchema;
}

/**
 * Get default form values based on signup flag
 */
export function getDefaultFormValues(isSignUp: boolean): SignupFormData | LoginFormData {
  const baseValues = {
    email: '',
    password: '',
  };

  if (isSignUp) {
    return {
      ...baseValues,
      name: '',
    } as SignupFormData;
  }

  return baseValues as LoginFormData;
}

/**
 * Extract redirect URL from search params
 */
export function getRedirectUrl(searchParams: URLSearchParams, defaultUrl: string): string {
  return searchParams.get('redirect') || defaultUrl;
}
