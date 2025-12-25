import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { OrganizationDetails } from '@/components/profile/OrganizationDetails';
import { OrganizationDetailsSkeleton } from '@/components/profile/OrganizationDetailsSkeleton';
import { useOrganizationDetailData } from '@/hooks/useOrganizationDetailData';
import { routes } from '@/lib/routes';
import { calculateUserOrgStatus } from '@/lib/utils/organization-utils';

export function profileOrganizationsDetailLoader() {
  return Response.json({});
}

export function ProfileOrganizationsDetailRoute() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const organizationId = params.id;

  if (!organizationId) {
    throw new Response('Organization ID is required', { status: 404 });
  }

  const { organizationQuery, myOrganizationsQuery, profileQuery } =
    useOrganizationDetailData(organizationId);

  // Handle errors
  useEffect(() => {
    if (organizationQuery.error) {
      throw new Response('Organization not found', { status: 404 });
    }
  }, [organizationQuery.error]);

  const organization = organizationQuery.data;
  const organizations = myOrganizationsQuery.data || [];
  const profile = profileQuery.data;

  if (!organization || !profile) {
    return <OrganizationDetailsSkeleton />;
  }

  const currentUserId = profile.id;

  // Calculate user's role and status in this organization
  const userOrgStatus = calculateUserOrgStatus(organizationId, organizations);
  const { role: userRole, status: userStatus, isAdmin, isPending } = userOrgStatus;

  const handleUpdate = () => {
    void organizationQuery.refetch();
  };

  const handleDelete = () => {
    navigate(routes.root.profileOrganizations());
  };

  return (
    <OrganizationDetails
      organization={organization}
      isAdmin={isAdmin}
      isPending={isPending}
      userRole={userRole}
      userStatus={userStatus}
      currentUserId={currentUserId}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
