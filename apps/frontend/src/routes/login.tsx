import { useTranslation } from 'react-i18next';
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router';
import { LanguageSwitcher } from '../components/language-switcher';
import { AuthApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import { sessionStore } from '../lib/session/store';

type LoginActionData = {
  error?: string;
};

export function loginLoader(_: LoaderFunctionArgs) {
  if (sessionStore.getSession()) {
    throw redirect('/');
  }
  return null;
}

export async function loginAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = String(formData.get('username') ?? '').trim();

  if (!username) {
    return Response.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    const result = await AuthApi.login({ username });

    sessionStore.setSession({
      token: result.token,
      username: result.user.username,
      userId: result.user.id,
    });

    return redirect('/');
  } catch (error) {
    if (error instanceof ApiError) {
      const message =
        typeof error.body === 'object' && error.body && 'error' in error.body
          ? ((error.body as { error?: { message?: string } }).error?.message ?? error.message)
          : error.message;

      return Response.json({ error: message }, { status: error.status });
    }

    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}

export function LoginRoute() {
  const { t } = useTranslation();
  const actionData = useActionData() as LoginActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-1/3 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      {/* Language switcher */}
      <div className="absolute right-6 top-6 z-10">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Login card */}
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur">
            {/* Brand header */}
            <header className="mb-8 text-center">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-sky-500 text-3xl shadow-[0_20px_50px_rgba(99,102,241,0.4)]">
                🌮
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                {t('login.title')}
              </h1>
              <p className="mt-2 text-sm text-slate-300">{t('login.subtitle')}</p>
            </header>

            {/* Login form */}
            <Form method="post" className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-slate-200"
                >
                  {t('common.username')}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder={t('login.usernamePlaceholder')}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 shadow-inner transition focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {actionData?.error ? (
                <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {actionData.error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 font-semibold text-white shadow-[0_20px_50px_rgba(99,102,241,0.35)] transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t('common.signingIn') : t('common.signIn')}
              </button>
            </Form>
          </div>

          {/* Footer branding */}
          <div className="mt-6 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {t('root.tacobot')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
