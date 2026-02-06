import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Avatar,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@tacocrew/ui-kit';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import appIcon from '@/assets/icon.png?format=webp&img';
import { LanguageSwitcher } from '@/components/language-switcher';
import { usePasswordVisibility } from '@/hooks/usePasswordVisibility';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/lib/routes';
import { type ResetPasswordFormData, resetPasswordSchema } from '@/lib/schemas';

export function ResetPasswordRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showPassword, togglePasswordVisibility } = usePasswordVisibility();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const handleSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });
      if (result.error) {
        setError(result.error.message || t('resetPassword.error'));
        return;
      }
      navigate(routes.signin());
    } catch {
      setError(t('resetPassword.error'));
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="relative flex min-h-screen items-center justify-center px-3 py-6 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          <Card className="relative overflow-hidden border-white/10 bg-slate-900/60 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Avatar color="brandHero" size="xl" variant="elevated">
                  <AvatarImage src={appIcon} alt="TacoCrew" />
                </Avatar>
              </div>
              <CardTitle className="text-3xl">{t('resetPassword.title')}</CardTitle>
              <p className="mt-2 text-slate-300 text-sm">{t('resetPassword.subtitle')}</p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {!token ? (
                <div className="space-y-4">
                  <Alert tone="error">{t('resetPassword.invalidToken')}</Alert>
                  <Link
                    to={routes.forgotPassword()}
                    className="flex items-center justify-center gap-2 text-brand-400 text-sm transition-colors hover:text-brand-300"
                  >
                    <ArrowLeft className="size-4" />
                    {t('resetPassword.backToForgotPassword')}
                  </Link>
                </div>
              ) : (
                <>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <Controller
                      name="password"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="password" required>
                            {t('resetPassword.password.label')}
                          </FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <Lock className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput
                              {...field}
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder={t('resetPassword.password.placeholder')}
                              disabled={isLoading}
                              autoComplete="new-password"
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

                    <Controller
                      name="confirmPassword"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="confirmPassword" required>
                            {t('resetPassword.confirmPassword.label')}
                          </FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <Lock className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput
                              {...field}
                              id="confirmPassword"
                              type={showPassword ? 'text' : 'password'}
                              placeholder={t('resetPassword.confirmPassword.placeholder')}
                              disabled={isLoading}
                              autoComplete="new-password"
                              aria-invalid={fieldState.invalid}
                            />
                          </InputGroup>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {error && <Alert tone="error">{error}</Alert>}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      variant="default"
                      size="lg"
                      fullWidth
                    >
                      {isLoading ? t('resetPassword.submitting') : t('resetPassword.submit')}
                    </Button>
                  </form>

                  <div className="text-center">
                    <Link
                      to={routes.signin()}
                      className="flex items-center justify-center gap-2 text-brand-400 text-sm transition-colors hover:text-brand-300"
                    >
                      <ArrowLeft className="size-4" />
                      {t('resetPassword.backToSignIn')}
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
