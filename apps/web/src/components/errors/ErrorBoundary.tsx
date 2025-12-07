import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import { NotFound } from '@/components/errors/NotFound';
import { Button, Card, CardContent, EmptyState } from '@/components/ui';
import { routes } from '@/lib/routes';

export function ErrorBoundary() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const error = useRouteError();

  // Handle 404 errors with a nice NotFound component
  if (isRouteErrorResponse(error) && error.status === 404) {
    const errorMessage =
      typeof error.data === 'string' ? error.data : error.statusText || t('errors.notFound.title');
    return <NotFound title={t('errors.notFound.title')} message={errorMessage} />;
  }

  // Handle 403 Forbidden
  if (isRouteErrorResponse(error) && error.status === 403) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
        <Card className="mx-auto w-full max-w-md lg:max-w-lg xl:max-w-xl">
          <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
            <EmptyState
              icon={AlertTriangle}
              title={t('errors.forbidden.title')}
              description={t('errors.forbidden.description')}
            />
            <div className="mt-6 flex justify-center sm:mt-8">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={() => navigate(routes.root.dashboard())}
              >
                <Home size={18} />
                {t('errors.forbidden.goHome')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle 400 Bad Request
  if (isRouteErrorResponse(error) && error.status === 400) {
    const errorMessage =
      typeof error.data === 'string'
        ? error.data
        : error.statusText || t('errors.badRequest.title');
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
        <Card className="mx-auto w-full max-w-md lg:max-w-lg xl:max-w-xl">
          <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
            <EmptyState
              icon={AlertTriangle}
              title={t('errors.badRequest.title')}
              description={errorMessage}
            />
            <div className="mt-6 flex justify-center sm:mt-8">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={() => window.history.back()}
              >
                <ArrowLeft size={18} />
                {t('errors.badRequest.goBack')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle other HTTP errors
  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
        <Card className="mx-auto w-full max-w-md lg:max-w-lg xl:max-w-xl">
          <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
            <EmptyState
              icon={AlertTriangle}
              title={t('errors.http.title', { status: error.status })}
              description={
                typeof error.data === 'string'
                  ? error.data
                  : error.statusText || t('errors.http.description')
              }
            />
            <div className="mt-6 flex justify-center sm:mt-8">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={() => navigate(routes.root.dashboard())}
              >
                <Home size={18} />
                {t('errors.http.goHome')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle JavaScript errors
  if (error instanceof Error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
        <Card className="mx-auto w-full max-w-md lg:max-w-lg xl:max-w-xl">
          <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
            <EmptyState
              icon={AlertTriangle}
              title={t('errors.application.title')}
              description={error.message || t('errors.application.description')}
            />
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={() => navigate(routes.root.dashboard())}
              >
                <Home size={18} />
                {t('errors.application.goHome')}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={18} />
                {t('errors.application.reload')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle unknown errors
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
      <Card className="mx-auto w-full max-w-md lg:max-w-lg xl:max-w-xl">
        <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
          <EmptyState
            icon={AlertTriangle}
            title={t('errors.unknown.title')}
            description={t('errors.unknown.description')}
          />
          <div className="mt-6 flex justify-center sm:mt-8">
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 sm:w-auto"
              onClick={() => navigate(routes.root.dashboard())}
            >
              <Home size={18} />
              {t('errors.unknown.goHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
