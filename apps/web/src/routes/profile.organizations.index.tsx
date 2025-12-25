import { Card, CardContent, EmptyState } from '@tacocrew/ui-kit';
import { Building2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMyOrganizations } from '@/lib/api/organization';
import { routes } from '@/lib/routes';

export function profileOrganizationsIndexLoader() {
  return Response.json({});
}

export function ProfileOrganizationsIndexRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const organizationsQuery = useMyOrganizations();
  const organizations = organizationsQuery.data || [];

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
