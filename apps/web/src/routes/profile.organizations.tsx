import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLoaderData, useLocation, useNavigate } from 'react-router';
import { OrganizationsList } from '@/components/profile/OrganizationsList';
import { Button, Card, CardContent, EmptyState } from '@/components/ui';
import { OrganizationApi } from '@/lib/api';
import { routes } from '@/lib/routes';
import type { LoaderData } from '@/lib/types/loader-types';
import { createLoader } from '@/lib/utils/loader-factory';

export const profileOrganizationsLoader = createLoader(
  async () => {
    const organizations = await OrganizationApi.getMyOrganizations();
    return { organizations };
  },
  { requireAuth: true }
);

export function ProfileOrganizationsRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { organizations } = useLoaderData<LoaderData<typeof profileOrganizationsLoader>>();

  const handleSelect = (orgId: string) => {
    navigate(routes.root.profileOrganizations.detail({ id: orgId }));
  };

  const handleCreateNew = () => {
    navigate(routes.root.profileOrganizations.new());
  };

  // Get selected organization ID from URL
  const currentPath = location.pathname;
  const detailMatch = currentPath.match(/\/profile\/organizations\/([^/]+)$/);
  const selectedId = detailMatch && !currentPath.endsWith('/new') ? detailMatch[1] : undefined;
  const isNewRoute = currentPath.endsWith('/new');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-semibold text-2xl text-white">{t('organizations.title')}</h1>
        <p className="mt-2 text-slate-400 text-sm">{t('organizations.description')}</p>
      </div>

      {organizations.length === 0 && !isNewRoute ? (
        /* Empty State */
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Building2}
              title={t('organizations.empty.title')}
              description={t('organizations.empty.description')}
            />
            <div className="mt-8 flex justify-center">
              <Button onClick={handleCreateNew} size="lg" className="gap-2">
                <Building2 size={18} />
                {t('organizations.empty.createButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Organizations List Sidebar */}
          <OrganizationsList
            organizations={organizations}
            selectedId={selectedId ?? ''}
            onSelect={handleSelect}
            onCreateNew={handleCreateNew}
            disabled={false}
          />

          {/* Main Content Area - Outlet for nested routes */}
          <div className="space-y-6">
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
}
