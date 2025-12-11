import { Building2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData, useNavigate } from 'react-router';
import { Card, CardContent, EmptyState } from '@/components/ui';
import { OrganizationApi } from '@/lib/api';
import { routes } from '@/lib/routes';
import type { LoaderData } from '@/lib/types/loader-types';
import { createLoader } from '@/lib/utils/loader-factory';

export const profileOrganizationsIndexLoader = createLoader(
  async () => {
    const organizations = await OrganizationApi.getMyOrganizations();
    return { organizations };
  },
  { requireAuth: true }
);

export function ProfileOrganizationsIndexRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizations } = useLoaderData<LoaderData<typeof profileOrganizationsIndexLoader>>();

  // Redirect to first organization if available
  useEffect(() => {
    if (organizations.length > 0) {
      navigate(routes.root.profileOrganizations.detail({ id: organizations[0].id }), {
        replace: true,
      });
    }
  }, [organizations, navigate]);

  // Show empty state while redirecting or if no organizations
  return (
    <Card>
      <CardContent className="py-12">
        <EmptyState
          icon={Building2}
          title={t('organizations.empty.select')}
          description={t('organizations.empty.selectDescription')}
        />
      </CardContent>
    </Card>
  );
}
