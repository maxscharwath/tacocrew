import { Button, Card, CardContent, EmptyState } from '@tacocrew/ui-kit';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { routes } from '@/lib/routes';

interface NotFoundProps {
  readonly title?: string;
  readonly message?: string;
  readonly showBackButton?: boolean;
}

export function NotFound({ title, message, showBackButton = true }: NotFoundProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(routes.root.dashboard());
  };

  const handleGoBack = () => {
    globalThis.history.back();
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
      <Card className="mx-auto w-full max-w-md lg:max-w-lg xl:max-w-xl">
        <CardContent className="px-4 py-8 sm:px-6 sm:py-12">
          <EmptyState
            icon={Search}
            title={title || t('errors.notFound.title')}
            description={message || t('errors.notFound.description')}
          />
          {showBackButton && (
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={handleGoHome}
              >
                <Home size={18} />
                {t('errors.notFound.goHome')}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                onClick={handleGoBack}
              >
                <ArrowLeft size={18} />
                {t('errors.notFound.goBack')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
