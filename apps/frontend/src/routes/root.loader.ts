import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router';
import { UserApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import { sessionStore } from '../lib/session/store';

export type RootLoaderData = {
  profile: Awaited<ReturnType<typeof UserApi.getProfile>>;
};

export async function rootLoader(_: LoaderFunctionArgs) {
  const session = sessionStore.getSession();

  if (!session) {
    throw redirect('/login');
  }

  try {
    const profile = await UserApi.getProfile();

    return Response.json({ profile });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      sessionStore.clearSession();
      throw redirect('/login');
    }

    throw error;
  }
}

export async function rootAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('_intent');

  if (intent === 'logout') {
    sessionStore.clearSession();
    throw redirect('/login');
  }

  return null;
}
