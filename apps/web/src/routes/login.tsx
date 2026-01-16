import {
  Alert,
  Avatar,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Divider,
  Field,
  FieldError,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  SegmentedControl,
  SegmentedControlItem,
} from '@tacocrew/ui-kit';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { type LoaderFunctionArgs, redirect, useLocation, useNavigate } from 'react-router';
import appIcon from '@/assets/icon.png?format=webp&img';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAuthForm } from '@/hooks/useAuthForm';
import { usePasswordVisibility } from '@/hooks/usePasswordVisibility';
import { ApiError } from '@/lib/api/http';
import { getProfile } from '@/lib/api/user';
import { authClient, useSession } from '@/lib/auth-client';
import { handleEmailPasswordAuth, handlePasskeySignIn } from '@/lib/handlers/auth-handlers';
import { routes } from '@/lib/routes';
import type { LoginFormData, SignupFormData } from '@/lib/schemas';
import { getRedirectUrl, getSubmitButtonText } from '@/lib/utils/auth-helpers';

/**
 * Authentication loader for both signin and signup pages
 * Redirects to home if user is already authenticated with a valid session
 */
export async function authenticationLoader({ request }: LoaderFunctionArgs) {
  const session = await authClient.getSession();
  if (!session?.data?.user) {
    return null;
  }

  // Verify the session is actually valid by checking the API
  try {
    await getProfile();
    // If we get here, session is valid, redirect to redirect parameter or home
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirect') || routes.root();
    // Note: redirect() throws a Response, which is the standard React Router pattern
    throw redirect(redirectTo);
  } catch (error) {
    // If API returns 401, session is invalid, stay on auth page
    if (error instanceof ApiError && error.statusCode === 401) {
      return null;
    }
    // Re-throw the redirect Response so React Router can handle it
    throw error;
  }
}

export function LoginRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname === routes.signup();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = getRedirectUrl(searchParams, routes.root());

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form and UI hooks
  const { form } = useAuthForm(isSignUp);
  const { showPassword, togglePasswordVisibility } = usePasswordVisibility();

  // Session management
  const { data: session } = useSession();

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      navigate(redirectTo);
    }
  }, [session, navigate, redirectTo]);

  const handleEmailPasswordSubmit = async (data: LoginFormData | SignupFormData) => {
    await handleEmailPasswordAuth(
      data,
      isSignUp,
      {
        onSuccess: () => navigate(redirectTo),
        onError: setError,
        onLoading: setIsLoading,
      },
      t
    );
  };

  const handlePasskeyClick = async () => {
    await handlePasskeySignIn(
      {
        onSuccess: () => navigate(redirectTo),
        onError: setError,
        onLoading: setIsLoading,
      },
      t
    );
  };

  const submitButtonText = getSubmitButtonText(isLoading, isSignUp, t);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-1/3 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      {/* Language switcher */}
      <div className="absolute top-3 right-3 z-10 sm:top-6 sm:right-6">
        <LanguageSwitcher />
      </div>

      {/* Login card */}
      <div className="relative flex min-h-screen items-center justify-center px-3 py-6 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          <Card className="relative overflow-hidden border-white/10 bg-slate-900/60 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Avatar color="brandHero" size="xl" variant="elevated">
                  <AvatarImage src={appIcon} alt="TacoCrew" />
                </Avatar>
              </div>
              <CardTitle className="text-3xl">
                {isSignUp ? t('login.signUp.title') : t('login.title')}
              </CardTitle>
              <p className="mt-2 text-slate-300 text-sm">
                {isSignUp ? t('login.signUp.subtitle') : t('login.subtitle')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Mode toggle */}
              <SegmentedControl
                value={isSignUp ? 'signup' : 'signin'}
                onValueChange={(nextMode) => {
                  setError(null);
                  if (nextMode === 'signup') {
                    navigate(routes.signup());
                  } else {
                    navigate(routes.signin());
                  }
                }}
              >
                <SegmentedControlItem value="signin">{t('login.signIn')}</SegmentedControlItem>
                <SegmentedControlItem value="signup">
                  {t('login.signUpButton')}
                </SegmentedControlItem>
              </SegmentedControl>

              {/* Passkey Sign In Button (only for sign in mode) */}
              {!isSignUp && (
                <>
                  <Button
                    type="button"
                    onClick={handlePasskeyClick}
                    disabled={isLoading}
                    variant="secondary"
                    fullWidth
                  >
                    <Lock size={18} />
                    {t('login.signInWithPasskey')}
                  </Button>

                  <Divider label={t('login.orUsePassword')} />
                </>
              )}

              {/* Email/Password form */}
              <form onSubmit={form.handleSubmit(handleEmailPasswordSubmit)} className="space-y-4">
                {isSignUp && (
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="name">{t('login.name.label')}</FieldLabel>
                        <InputGroup>
                          <InputGroupAddon>
                            <User className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput
                            {...field}
                            id="name"
                            type="text"
                            placeholder={t('login.name.placeholder')}
                            disabled={isLoading}
                            autoComplete="name"
                            aria-invalid={fieldState.invalid}
                          />
                        </InputGroup>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                )}

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email" required>
                        {t('login.email.label')}
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <Mail className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          {...field}
                          id="email"
                          type="email"
                          placeholder={t('login.email.placeholder')}
                          disabled={isLoading}
                          autoComplete="email"
                          aria-invalid={fieldState.invalid}
                        />
                      </InputGroup>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password" required>
                        {t('login.password.label')}
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <Lock className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          {...field}
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('login.password.placeholder')}
                          disabled={isLoading}
                          autoComplete={isSignUp ? 'new-password' : 'current-password'}
                          aria-invalid={fieldState.invalid}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            onClick={togglePasswordVisibility}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {error && <Alert tone="error">{error}</Alert>}

                <Button type="submit" disabled={isLoading} variant="default" size="lg" fullWidth>
                  {submitButtonText}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
