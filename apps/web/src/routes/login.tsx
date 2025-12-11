import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LoaderFunctionArgs, redirect, useLocation, useNavigate } from 'react-router';
import appIcon from '@/assets/icon.png?format=webp';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Divider,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Label,
  SegmentedControl,
} from '@/components/ui';
import { UserApi } from '@/lib/api';
import { ApiError } from '@/lib/api/http';
import { authClient, useSession } from '@/lib/auth-client';
import { routes } from '@/lib/routes';

/**
 * Authentication loader for both signin and signup pages
 * Redirects to home if user is already authenticated with a valid session
 */
export async function authenticationLoader({ request }: LoaderFunctionArgs) {
  // Check if user is already signed in with Better Auth
  // Only redirect if we have a valid session - don't redirect if session is invalid
  const session = await authClient.getSession();
  if (!session?.data?.user) {
    return null;
  }

  // Verify the session is actually valid by checking the API
  try {
    await UserApi.getProfile();
    // If we get here, session is valid, redirect to redirect parameter or home
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirect') || routes.root();
    // Note: redirect() throws a Response, which is the standard React Router pattern
    throw redirect(redirectTo);
  } catch (error) {
    // If API returns 401, session is invalid, stay on auth page
    if (error instanceof ApiError && error.status === 401) {
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
  const redirectTo = searchParams.get('redirect') || routes.root();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  // Use Better Auth's useSession hook for reactive, cached session data
  const { data: session } = useSession();

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      navigate(redirectTo);
    }
  }, [session, navigate, redirectTo]);

  const handleEmailPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email(formData);

        if (result.error) {
          setError(result.error.message || t('login.signUpFailed'));
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
        });

        if (result.error) {
          setError(result.error.message || t('login.signInFailed'));
          return;
        }
      }

      // Redirect on success - use redirect parameter if available
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to handle successful passkey authentication
  const handlePasskeySuccess = () => {
    setIsLoading(false);
    navigate(redirectTo);
  };

  // Helper to handle passkey authentication errors
  const handlePasskeyError = (error: unknown) => {
    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? (error.message as string)
        : t('login.passkeySignInFailed');
    setError(errorMessage);
    setIsLoading(false);
  };

  // Helper to check if error is a cancellation
  const isCancellationError = (error: unknown): boolean => {
    return !!(
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'AUTH_CANCELLED'
    );
  };

  // Helper function to attempt passkey sign-in
  const attemptPasskeySignIn = async (useAutoFill: boolean): Promise<boolean> => {
    try {
      const result = await authClient.signIn.passkey({
        autoFill: useAutoFill,
        fetchOptions: {
          onSuccess: handlePasskeySuccess,
          onError: (ctx) => {
            const isCancelled = isCancellationError(ctx.error);
            if (!isCancelled) {
              handlePasskeyError(ctx.error);
            }
          },
        },
      });

      // Handle result if callbacks didn't fire
      if (result?.error) {
        const isCancelled = isCancellationError(result.error);
        if (isCancelled) {
          return false;
        }
        handlePasskeyError(result.error);
        return false;
      }

      if (result?.data) {
        handlePasskeySuccess();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const handlePasskeySignIn = async () => {
    setIsLoading(true);
    setError(null);

    // Check if WebAuthn is supported
    if (!globalThis.PublicKeyCredential) {
      setError(
        'Passkeys are not supported in this browser. Please use a modern browser that supports WebAuthn.'
      );
      setIsLoading(false);
      return;
    }

    // Note: You may see a browser console warning "port.close of passkey-signin-prompt failed"
    // This is harmless and occurs when the WebAuthn prompt is cancelled or closed.
    // It's a browser internal message and doesn't affect functionality.

    try {
      // First try with autoFill
      const success = await attemptPasskeySignIn(true);

      // If autoFill was cancelled, try without autoFill (user will see selection dialog)
      if (!success) {
        const retrySuccess = await attemptPasskeySignIn(false);

        if (!retrySuccess) {
          // Both attempts failed or were canceled
          setError(
            'Passkey sign-in was cancelled. Please try again and select your passkey when prompted.'
          );
          setIsLoading(false);
        }
      }
    } catch (err) {
      // Catch any unexpected errors
      setError(err instanceof Error ? err.message : t('login.passkeyAuthFailed'));
      setIsLoading(false);
    }
  };

  // Determine button text based on state
  const getSubmitButtonText = () => {
    if (isLoading) return t('login.pleaseWait');
    if (isSignUp) return t('login.signUpButton');
    return t('login.signIn');
  };
  const submitButtonText = getSubmitButtonText();

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-24 absolute right-1/3 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
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
                <Avatar color="brandHero" size="xl" variant="elevated" src={appIcon} />
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
                options={[
                  { value: 'signin', label: t('login.signIn') },
                  { value: 'signup', label: t('login.signUpButton') },
                ]}
              />

              {/* Passkey Sign In Button (only for sign in mode) */}
              {!isSignUp && (
                <>
                  <Button
                    type="button"
                    onClick={handlePasskeySignIn}
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
              <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('login.name.label')}</Label>
                    <InputGroup>
                      <InputGroupAddon>
                        <User className="size-4" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('login.name.placeholder')}
                        disabled={isLoading}
                        autoComplete="name"
                      />
                    </InputGroup>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t('login.email.label')}</Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <Mail className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('login.email.placeholder')}
                      required
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </InputGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('login.password.label')}</Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <Lock className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={t('login.password.placeholder')}
                      required
                      disabled={isLoading}
                      minLength={8}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>

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
