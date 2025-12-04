import { type LoaderFunctionArgs, redirect } from 'react-router';
import { UserApi } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/lib/routes';
import { sessionStore } from '@/lib/session/store';
import { createActionHandler } from '@/lib/utils/action-handler';
import { isLoginRoute, requireSession, withAuthErrorHandling } from '@/lib/utils/loader-helpers';

export type RootLoaderData = {
  profile: Awaited<ReturnType<typeof UserApi.getProfile>>;
};

export async function rootLoader({ request }: LoaderFunctionArgs) {
  // Skip rootLoader if we're already on the login page to prevent infinite loops
  if (isLoginRoute(request)) {
    return Response.json({ profile: null });
  }

  // Check session first to avoid unnecessary API calls
  await requireSession(request);

  // Fetch profile with error handling
  const profile = await withAuthErrorHandling(() => UserApi.getProfile(), request);
  return Response.json({ profile });
}

export const rootAction = createActionHandler({
  handlers: {
    POST: async ({ formData }) => {
      const intent = formData.get('_intent');
      if (intent === 'logout') {
        // Sign out from Better Auth (clears cookies)
        await authClient.signOut();
        // Also clear the old JWT session store for backward compatibility
        sessionStore.clearSession();
        return redirect(routes.signin());
      }
      throw new Response('Invalid action', { status: 400 });
    },
  },
  getFormName: async (_method, request) => {
    const formData = await request.clone().formData();
    return formData.get('_intent')?.toString() || 'unknown';
  },
  onSuccess: () => {
    // Should not reach here for logout (throws redirect)
    return new Response(null, { status: 204 });
  },
});
