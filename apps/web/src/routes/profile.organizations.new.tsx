import { toast } from '@tacocrew/ui-kit';
import { useTranslation } from 'react-i18next';
import { useNavigate, useRevalidator } from 'react-router';
import { OrganizationCreateForm } from '@/components/profile/OrganizationCreateForm';
import { useCreateOrganization } from '@/lib/api/organization';
import type { OrganizationPayload } from '@/lib/api/types';
import { routes } from '@/lib/routes';

export function ProfileOrganizationsNewRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const createMutation = useCreateOrganization();

  const handleSubmit = async (
    data: OrganizationPayload,
    avatarFile: File | null,
    backgroundColor: string | null
  ) => {
    const loadingToastId = toast.loading(t('organizations.messages.creating'));

    createMutation.mutate(
      {
        body: data,
        avatarFile: avatarFile ?? undefined,
        backgroundColor: backgroundColor ?? undefined,
      },
      {
        onSuccess: (newOrg) => {
          toast.success(t('organizations.messages.createdWithName', { name: newOrg.name }), {
            id: loadingToastId,
          });
          revalidator.revalidate();
          navigate(routes.root.profileOrganizations.detail({ id: newOrg.id }));
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : t('organizations.messages.genericError');
          toast.error(t('organizations.messages.createFailed', { error: errorMessage }), {
            id: loadingToastId,
          });
        },
      }
    );
  };

  const handleCancel = () => {
    navigate(routes.root.profileOrganizations());
  };

  return <OrganizationCreateForm onSubmit={handleSubmit} onCancel={handleCancel} />;
}
