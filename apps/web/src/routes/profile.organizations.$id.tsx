import { type LoaderFunctionArgs, useLoaderData, useNavigate, useRevalidator } from 'react-router';
import { OrganizationDetails } from '@/components/profile/OrganizationDetails';
import { OrganizationApi, UserApi } from '@/lib/api';
import { ApiError } from '@/lib/api/http';
import type { Organization } from '@/lib/api/types';
import { routes } from '@/lib/routes';

type LoaderData = {
  organization: Awaited<ReturnType<typeof OrganizationApi.getOrganizationById>>;
  organizations: Awaited<ReturnType<typeof OrganizationApi.getMyOrganizations>>;
  currentUserId: string;
  userRole: 'ADMIN' | 'MEMBER' | null;
  userStatus: 'ACTIVE' | 'PENDING' | null;
  isAdmin: boolean;
  isPending: boolean;
};

export async function profileOrganizationsDetailLoader({ params }: LoaderFunctionArgs) {
  const organizationId = params.id;
  if (!organizationId) {
    throw new Response('Organization ID is required', { status: 400 });
  }

  try {
    const [organization, organizations, profile] = await Promise.all([
      OrganizationApi.getOrganizationById(organizationId),
      OrganizationApi.getMyOrganizations(),
      UserApi.getProfile(),
    ]);

    if (!organization) {
      throw new Response('Organization not found', { status: 404 });
    }

    // Find user's role and status in this organization
    const userOrg = organizations.find((org) => org.id === organizationId);
    const userRole = userOrg?.role ?? null;
    const userStatus = userOrg?.status ?? null;
    const isAdmin = userRole === 'ADMIN' && userStatus === 'ACTIVE';
    const isPending = userStatus === 'PENDING';

    return Response.json({
      organization,
      organizations,
      currentUserId: profile.id,
      userRole,
      userStatus,
      isAdmin,
      isPending,
    });
  } catch (error) {
    // Convert ApiError to Response for React Router
    if (error instanceof ApiError) {
      throw new Response(error.message || 'An error occurred', { status: error.status });
    }
    // Re-throw Response objects as-is
    if (error instanceof Response) {
      throw error;
    }
    // Re-throw other errors
    throw error;
  }
}

export function ProfileOrganizationsDetailRoute() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { organization, currentUserId, userRole, userStatus, isAdmin, isPending } =
    useLoaderData<LoaderData>();

  const handleUpdate = () => {
    revalidator.revalidate();
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
