import { type LoaderFunctionArgs, redirect } from 'react-router';
import { UserApi } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/lib/routes';
import { createActionHandler } from '@/lib/utils/action-handler';
import { isLoginRoute, withAuthErrorHandling } from '@/lib/utils/loader-helpers';

export type RootLoaderData = {
  profile: Awaited<ReturnType<typeof UserApi.getProfile>> | null;
};

export async function rootLoader({ request }: LoaderFunctionArgs) {
  if (isLoginRoute(request)) {
    return Response.json({ profile: null });
  }

  // API call handles 401 → redirect to login
  const profile = await withAuthErrorHandling(() => UserApi.getProfile(), request);
  return Response.json({ profile });
}

export const rootAction = createActionHandler({
  handlers: {
    POST: async ({ formData }) => {
      const intent = formData.get('_intent');
      if (intent === 'logout') {
        await authClient.signOut();
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
