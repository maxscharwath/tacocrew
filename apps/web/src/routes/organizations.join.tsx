import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
} from '@tacocrew/ui-kit';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData, useNavigate } from 'react-router';
import { OrganizationAvatar } from '@/components/shared/OrganizationAvatar';
import { OrganizationApi } from '@/lib/api';
import { ApiError } from '@/lib/api/http';
import { routes } from '@/lib/routes';
import type { LoaderData } from '@/lib/types/loader-types';
import { createLoader } from '@/lib/utils/loader-factory';
import { requireParam } from '@/lib/utils/param-validators';

export const organizationJoinLoader = createLoader(
  async ({ params }) => {
    const organizationId = requireParam(params, 'id', 'Organization ID is required');
    const organization = await OrganizationApi.getOrganizationById(organizationId);
    return { organization };
  }
);

export function OrganizationJoinRoute() {
  const { organization } = useLoaderData<LoaderData<typeof organizationJoinLoader>>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    if (busy || joined) return;

    setBusy(true);
    try {
      await OrganizationApi.requestToJoinOrganization(organization.id);
      setJoined(true);
      toast.success(t('organizations.join.success'));
    } catch (error) {
      // Check if it's a conflict error (already member or pending)
      if (error instanceof ApiError && error.status === 409) {
        // Extract message from error body
        const errorBody = error.body as { error?: { message?: string } };
        const errorMessage =
          errorBody?.error?.message || error.message || t('organizations.join.error');
        toast.error(errorMessage);
        // If already a member or pending, show as joined
        if (
          errorMessage.includes('already a member') ||
          errorMessage.includes('already have a pending')
        ) {
          setJoined(true);
        }
      } else if (error instanceof ApiError) {
        const errorBody = error.body as { error?: { message?: string } };
        const errorMessage =
          errorBody?.error?.message || error.message || t('organizations.join.error');
        toast.error(errorMessage);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('organizations.join.error'));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoToOrganizations = () => {
    navigate(routes.root.profileOrganizations());
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-1/2 h-72 w-72 animate-pulse rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen items-center justify-center p-3 sm:p-6">
        <Card className="w-full max-w-lg border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition-all duration-300 hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40">
          <CardHeader className="space-y-6 pb-8 text-center">
            <div className="relative mx-auto">
              <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl" />
              <div className="relative flex h-28 w-28 items-center justify-center">
                <OrganizationAvatar
                  organizationId={organization.id}
                  name={organization.name}
                  color="brandHero"
                  size="2xl"
                  variant="elevated"
                  className="shadow-lg"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <CardTitle className="font-bold text-4xl text-white tracking-tight">
                  {organization.name}
                </CardTitle>
              </div>
              <CardDescription className="text-base text-slate-300 leading-relaxed">
                {t('organizations.join.description')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {joined ? (
              <Alert tone="success" className="border-green-500/50 bg-green-500/10 shadow-lg">
                <div className="space-y-1">
                  <p className="font-bold text-base text-green-100">
                    {t('organizations.join.requestSent')}
                  </p>
                  <p className="text-green-200/90 text-sm leading-relaxed">
                    {t('organizations.join.waitingApproval')}
                  </p>
                </div>
              </Alert>
            ) : (
              <div className="space-y-6">
                <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-800/30 p-5 backdrop-blur-sm transition-all hover:border-brand-400/30 hover:bg-slate-800/40">
                  <div className="absolute inset-0 bg-linear-to-br from-brand-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative space-y-2">
                    <p className="font-semibold text-base text-white">
                      {t('organizations.join.infoTitle')}
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {t('organizations.join.info')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleJoin}
                  disabled={busy}
                  className="group relative w-full gap-2 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                  variant="default"
                  size="lg"
                >
                  <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform group-hover:translate-x-full" />
                  {busy ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span className="font-semibold">{t('organizations.join.requesting')}</span>
                    </>
                  ) : (
                    <span className="font-semibold">{t('organizations.join.button')}</span>
                  )}
                </Button>
              </div>
            )}
            <div className="border-white/10 border-t pt-4">
              <Button
                onClick={handleGoToOrganizations}
                variant="ghost"
                className="w-full transition-colors hover:bg-slate-800/50"
                size="sm"
              >
                {t('organizations.join.backToOrganizations')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
