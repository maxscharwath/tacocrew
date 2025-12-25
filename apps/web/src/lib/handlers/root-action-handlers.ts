/**
 * Root action handlers
 * Handlers for root-level actions (logout, etc.)
 */

import { redirect } from 'react-router';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/lib/routes';

export const ROOT_ACTION_INTENT = {
  LOGOUT: 'logout',
} as const;

export type RootActionIntent = (typeof ROOT_ACTION_INTENT)[keyof typeof ROOT_ACTION_INTENT];

/**
 * Handle logout action
 */
export async function handleLogout(): Promise<never> {
  await authClient.signOut();
  throw redirect(routes.signin());
}

/**
 * Get intent from form data
 */
export function getIntentFromFormData(formData: FormData): string {
  return formData.get('_intent')?.toString() || 'unknown';
}

/**
 * Check if intent is valid root action
 */
export function isValidRootActionIntent(intent: string): intent is RootActionIntent {
  return Object.values(ROOT_ACTION_INTENT).includes(intent as RootActionIntent);
}

/**
 * Process root action intent
 */
export async function processRootActionIntent(intent: string): Promise<Response | never> {
  switch (intent) {
    case ROOT_ACTION_INTENT.LOGOUT:
      return await handleLogout();

    default:
      throw new Response('Invalid action', { status: 400 });
  }
}
