import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Home,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useLocation, useNavigate, useRouteError } from 'react-router';
import { Button, Card, CardContent, EmptyState } from '@/components/ui';
import { ApiError } from '@/lib/api/http';
import { routes } from '@/lib/routes';

export function OrganizationError() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const error = useRouteError();

  // Check if we can go back - location.key is set when navigating (not 'default' on initial load)
  // Also check history length as a fallback
  const canGoBack = location.key !== 'default' || window.history.length > 1;

  const handleGoBack = () => {
    navigate(-1);
  };

  // Handle 404 - Organization not found
  // Check both RouteErrorResponse and ApiError
  const is404 =
    (isRouteErrorResponse(error) && error.status === 404) ||
    (error instanceof ApiError && error.status === 404);

  if (is404) {
    return (
      <div className="flex items-start justify-center p-4 pt-8 sm:p-6 sm:pt-12">
        <Card className="mx-auto w-full max-w-2xl">
          <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-800/50 ring-4 ring-slate-800/30">
                <Search className="h-12 w-12 text-slate-400" />
              </div>
              <EmptyState
                title={t('errors.organization.notFound.title')}
                description={t('errors.organization.notFound.description')}
              />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={() => navigate(routes.root.profileOrganizations())}
              >
                <Building2 size={18} />
                {t('errors.organization.notFound.goToOrganizations')}
              </Button>
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full gap-2 sm:w-auto"
                  onClick={handleGoBack}
                >
                  <ArrowLeft size={18} />
                  {t('errors.organization.notFound.goBack')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle 403 - Forbidden (user doesn't have access)
  const is403 =
    (isRouteErrorResponse(error) && error.status === 403) ||
    (error instanceof ApiError && error.status === 403);

  if (is403) {
    return (
      <div className="flex items-start justify-center p-4 pt-8 sm:p-6 sm:pt-12">
        <Card className="mx-auto w-full max-w-2xl">
          <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 ring-4 ring-amber-500/20">
                <ShieldAlert className="h-12 w-12 text-amber-500" />
              </div>
              <EmptyState
                title={t('errors.organization.forbidden.title')}
                description={t('errors.organization.forbidden.description')}
              />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={() => navigate(routes.root.profileOrganizations())}
              >
                <Building2 size={18} />
                {t('errors.organization.forbidden.goToOrganizations')}
              </Button>
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full gap-2 sm:w-auto"
                  onClick={handleGoBack}
                >
                  <ArrowLeft size={18} />
                  {t('errors.organization.forbidden.goBack')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle 400 - Bad Request (e.g., missing organization ID)
  const is400 =
    (isRouteErrorResponse(error) && error.status === 400) ||
    (error instanceof ApiError && error.status === 400);

  if (is400) {
    return (
      <div className="flex items-start justify-center p-4 pt-8 sm:p-6 sm:pt-12">
        <Card className="mx-auto w-full max-w-2xl">
          <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 ring-4 ring-red-500/20">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <EmptyState
                title={t('errors.organization.badRequest.title')}
                description={t('errors.organization.badRequest.description')}
              />
            </div>
            <div className="mt-8 flex justify-center sm:mt-10">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={() => navigate(routes.root.profileOrganizations())}
              >
                <Building2 size={18} />
                {t('errors.organization.badRequest.goToOrganizations')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle other errors - fallback to generic error
  return (
    <div className="flex items-start justify-center p-4 pt-8 sm:p-6 sm:pt-12">
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-800/50 ring-4 ring-slate-800/30">
              <AlertTriangle className="h-12 w-12 text-slate-400" />
            </div>
            <EmptyState
              title={t('errors.organization.generic.title')}
              description={t('errors.organization.generic.description')}
            />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 sm:w-auto"
              onClick={() => navigate(routes.root.profileOrganizations())}
            >
              <Building2 size={18} />
              {t('errors.organization.generic.goToOrganizations')}
            </Button>
            {canGoBack && (
              <Button
                variant="ghost"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={handleGoBack}
              >
                <ArrowLeft size={18} />
                {t('errors.organization.generic.goBack')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
