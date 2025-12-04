import { type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { OrganizationsManager } from '@/components/profile/OrganizationsManager';
import { OrganizationApi } from '@/lib/api';

type LoaderData = {
  organizations: Awaited<ReturnType<typeof OrganizationApi.getMyOrganizations>>;
};

export async function profileOrganizationsLoader(_: LoaderFunctionArgs) {
  const organizations = await OrganizationApi.getMyOrganizations();
  return Response.json({ organizations });
}

export function ProfileOrganizationsRoute() {
  const { organizations } = useLoaderData<LoaderData>();

  return (
    <div className="p-3 sm:p-6">
      <OrganizationsManager organizations={organizations} />
    </div>
  );
}
