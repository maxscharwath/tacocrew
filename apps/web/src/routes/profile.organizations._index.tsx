import { Building2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router';
import { Card, CardContent, EmptyState } from '@/components/ui';
import { OrganizationApi } from '@/lib/api';

type LoaderData = {
  organizations: Awaited<ReturnType<typeof OrganizationApi.getMyOrganizations>>;
};

export async function profileOrganizationsIndexLoader(_: LoaderFunctionArgs) {
  const organizations = await OrganizationApi.getMyOrganizations();
  return Response.json({ organizations });
}

export function ProfileOrganizationsIndexRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizations } = useLoaderData<LoaderData>();

  // Redirect to first organization if available
  useEffect(() => {
    if (organizations.length > 0) {
      navigate(`/profile/organizations/${organizations[0].id}`, {
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
