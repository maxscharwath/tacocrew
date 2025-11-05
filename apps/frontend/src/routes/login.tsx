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
    <div className="login-shell">
      <div className="login-card">
        <div className="absolute right-6 top-6">
          <LanguageSwitcher />
        </div>

        <header>
          <div className="brand-icon" aria-hidden>
            🌮
          </div>
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </header>

        <Form method="post" className="login-form">
          <label htmlFor="username">{t('common.username')}</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder={t('login.usernamePlaceholder')}
            required
            disabled={isSubmitting}
          />

          {actionData?.error ? <p className="form-error">{actionData.error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.signingIn') : t('common.signIn')}
          </button>
        </Form>
      </div>
    </div>
  );
}
