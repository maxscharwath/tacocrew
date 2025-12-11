import { useTranslation } from 'react-i18next';
import { useNavigate, useRevalidator } from 'react-router';
import { OrganizationCreateForm } from '@/components/profile/OrganizationCreateForm';
import { toast } from '@/components/ui';
import { OrganizationApi } from '@/lib/api';
import type { OrganizationPayload } from '@/lib/api/types';
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
    const loadingToastId = toast.loading(t('organizations.messages.creating'));
    try {
      const newOrg = await OrganizationApi.createOrganization(data, avatarFile, backgroundColor);
      toast.success(t('organizations.messages.createdWithName', { name: newOrg.name }), {
        id: loadingToastId,
      });
      revalidator.revalidate();
      navigate(routes.root.profileOrganizations.detail({ id: newOrg.id }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      toast.error(t('organizations.messages.createFailed', { error: errorMessage }), {
        id: loadingToastId,
      });
      throw error; // Re-throw so form can handle it
    }
  };

  const handleCancel = () => {
    navigate(routes.root.profileOrganizations());
  };

  return <OrganizationCreateForm onSubmit={handleSubmit} onCancel={handleCancel} />;
}
