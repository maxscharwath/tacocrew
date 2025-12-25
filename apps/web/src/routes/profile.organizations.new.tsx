import { useTranslation } from 'react-i18next';
import { useNavigate, useRevalidator } from 'react-router';
import { OrganizationCreateForm } from '@/components/profile/OrganizationCreateForm';
import type { OrganizationPayload } from '@/lib/api/types';
import { handleCreateOrganization } from '@/lib/handlers/organization-handlers';
import { routes } from '@/lib/routes';

export function ProfileOrganizationsNewRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const handleSubmit = async (
    data: OrganizationPayload,
    avatarFile: File | null,
    backgroundColor: string | null
  ) => {
    await handleCreateOrganization(data, avatarFile, backgroundColor, {
      onSuccess: (orgId) => {
        revalidator.revalidate();
        navigate(routes.root.profileOrganizations.detail({ id: orgId }));
      },
      onError: () => {
        // Error toast already shown by handler
      },
      t,
    });
  };

  const handleCancel = () => {
    navigate(routes.root.profileOrganizations());
  };

  return <OrganizationCreateForm onSubmit={handleSubmit} onCancel={handleCancel} />;
}
