import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router';
import { UserApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import { authClient } from '../lib/auth-client';
import { routes } from '../lib/routes';
import { sessionStore } from '../lib/session/store';

export type RootLoaderData = {
  profile: Awaited<ReturnType<typeof UserApi.getProfile>>;
};

export async function rootLoader(_: LoaderFunctionArgs) {
  // Don't check session here - let the API validate it via cookies
  // The API will return 401 if the session is invalid, which we'll catch below
  try {
    const profile = await UserApi.getProfile();

    return Response.json({ profile });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // Clear both session types on 401
      sessionStore.clearSession();
      // Better Auth session is cleared via cookies, no action needed
      throw redirect(routes.login());
    }

    throw error;
  }
}

export async function rootAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('_intent');

  if (intent === 'logout') {
    // Sign out from Better Auth (clears cookies)
    await authClient.signOut();
    // Also clear the old JWT session store for backward compatibility
    sessionStore.clearSession();
    throw redirect(routes.login());
  }

  return null;
}
