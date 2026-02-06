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
  InputGroupInput,
} from '@tacocrew/ui-kit';
import { ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import appIcon from '@/assets/icon.png?format=webp&img';
import { LanguageSwitcher } from '@/components/language-switcher';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/lib/routes';
import { type ForgotPasswordFormData, forgotPasswordSchema } from '@/lib/schemas';

export function ForgotPasswordRoute() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        setError(result.error.message || t('forgotPassword.error'));
        return;
      }
      setIsSubmitted(true);
    } catch {
      setError(t('forgotPassword.error'));
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
              <CardTitle className="text-3xl">{t('forgotPassword.title')}</CardTitle>
              <p className="mt-2 text-slate-300 text-sm">{t('forgotPassword.subtitle')}</p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {isSubmitted ? (
                <div className="space-y-4">
                  <Alert tone="success">{t('forgotPassword.success')}</Alert>
                  <Link
                    to={routes.signin()}
                    className="flex items-center justify-center gap-2 text-brand-400 text-sm transition-colors hover:text-brand-300"
                  >
                    <ArrowLeft className="size-4" />
                    {t('forgotPassword.backToSignIn')}
                  </Link>
                </div>
              ) : (
                <>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

                    {error && <Alert tone="error">{error}</Alert>}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      variant="default"
                      size="lg"
                      fullWidth
                    >
                      {isLoading ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
                    </Button>
                  </form>

                  <div className="text-center">
                    <Link
                      to={routes.signin()}
                      className="flex items-center justify-center gap-2 text-brand-400 text-sm transition-colors hover:text-brand-300"
                    >
                      <ArrowLeft className="size-4" />
                      {t('forgotPassword.backToSignIn')}
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
