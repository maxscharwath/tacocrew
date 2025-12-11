import { Building2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRevalidator } from 'react-router';
import { OrganizationCreateForm } from '@/components/profile/OrganizationCreateForm';
import { OrganizationDetails } from '@/components/profile/OrganizationDetails';
import { OrganizationsList } from '@/components/profile/OrganizationsList';
import { Button, Card, CardContent, EmptyState, toast } from '@/components/ui';
import { OrganizationApi, UserApi } from '@/lib/api';
import type { Organization, OrganizationPayload } from '@/lib/api/types';

interface OrganizationsManagerProps {
  readonly organizations: Organization[];
}

interface OrganizationContentProps {
  readonly isCreating: boolean;
  readonly selectedOrganization: Organization | undefined;
  readonly isAdmin: boolean;
  readonly isPending: boolean;
  readonly userRole: 'ADMIN' | 'MEMBER' | null;
  readonly userStatus: 'ACTIVE' | 'PENDING' | null;
  readonly currentUserId: string;
  readonly onCreateSubmit: (
    data: OrganizationPayload,
    avatarFile: File | null,
    backgroundColor: string | null
  ) => Promise<void>;
  readonly onCreateCancel: () => void;
  readonly onUpdate: (updated: Organization) => void;
  readonly onDelete: () => void;
}

function OrganizationContent({
  isCreating,
  selectedOrganization,
  isAdmin,
  isPending,
  userRole,
  userStatus,
  currentUserId,
  onCreateSubmit,
  onCreateCancel,
  onUpdate,
  onDelete,
}: OrganizationContentProps) {
  const { t } = useTranslation();

  if (isCreating) {
    return (
      <OrganizationCreateForm
        onSubmit={onCreateSubmit}
        onCancel={onCreateCancel}
        disabled={false}
      />
    );
  }

  if (selectedOrganization) {
    return (
      <OrganizationDetails
        organization={selectedOrganization}
        isAdmin={isAdmin}
        isPending={isPending}
        userRole={userRole}
        userStatus={userStatus}
        currentUserId={currentUserId}
        onUpdate={onUpdate}
        onDelete={onDelete}
        disabled={false}
      />
    );
  }

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

export function OrganizationsManager({
  organizations: initialOrganizations,
}: OrganizationsManagerProps) {
  const { t } = useTranslation();
  const revalidator = useRevalidator();
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [selectedId, setSelectedId] = useState<string>(organizations[0]?.id ?? '');
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  const [userStatus, setUserStatus] = useState<'ACTIVE' | 'PENDING' | null>(null);

  const selectedOrganization = organizations.find((org) => org.id === selectedId);

  // Sync local state with loader data when it changes
  useEffect(() => {
    setOrganizations(initialOrganizations);
    // Update selectedId if current selection is no longer in the list
    setSelectedId((currentSelectedId) => {
      if (currentSelectedId && !initialOrganizations.find((org) => org.id === currentSelectedId)) {
        return initialOrganizations[0]?.id ?? '';
      }
      return currentSelectedId;
    });
  }, [initialOrganizations]);

  // Load current user ID
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const profile = await UserApi.getProfile();
        setCurrentUserId(profile.id);
      } catch (error) {
        console.error('Failed to load user profile', error);
      }
    };
    loadUserInfo();
  }, []);

  // Load user role and status when organization is selected
  useEffect(() => {
    if (selectedId && currentUserId) {
      const org = organizations.find((o) => o.id === selectedId);
      if (org?.role && org?.status) {
        setUserRole(org.role);
        setUserStatus(org.status);
      } else {
        setUserRole(null);
        setUserStatus(null);
      }
    } else {
      setUserRole(null);
      setUserStatus(null);
    }
  }, [selectedId, currentUserId, organizations]);

  const isAdmin = userRole === 'ADMIN' && userStatus === 'ACTIVE';
  const isPending = userStatus === 'PENDING';

  const selectOrganization = (orgId: string) => {
    setSelectedId(orgId);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedId('');
    setIsCreating(true);
  };

  const handleCreateSubmit = async (
    data: OrganizationPayload,
    avatarFile: File | null,
    backgroundColor: string | null
  ) => {
    const loadingToastId = toast.loading(t('organizations.messages.creating'));
    try {
      const newOrg = await OrganizationApi.createOrganization(data, avatarFile, backgroundColor);
      setOrganizations((prev) => [...prev, newOrg]);
      setSelectedId(newOrg.id);
      setIsCreating(false);
      toast.success(t('organizations.messages.createdWithName', { name: newOrg.name }), {
        id: loadingToastId,
      });
      // Revalidate loader data to sync with server
      revalidator.revalidate();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      toast.error(t('organizations.messages.createFailed', { error: errorMessage }), {
        id: loadingToastId,
      });
      throw error; // Re-throw so form can handle it
    }
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    setSelectedId(organizations[0]?.id ?? '');
  };

  const handleOrganizationUpdate = (updated: Organization) => {
    setOrganizations((prev) => prev.map((org) => (org.id === updated.id ? updated : org)));
    revalidator.revalidate();
  };

  const handleOrganizationDelete = () => {
    const remainingOrgs = organizations.filter((org) => org.id !== selectedId);
    setOrganizations(remainingOrgs);
    setSelectedId(remainingOrgs[0]?.id ?? '');
    revalidator.revalidate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-semibold text-2xl text-white">{t('organizations.title')}</h1>
        <p className="mt-2 text-slate-400 text-sm">{t('organizations.description')}</p>
      </div>

      {organizations.length === 0 && !isCreating ? (
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
                <Plus size={18} />
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
            selectedId={selectedId}
            onSelect={selectOrganization}
            onCreateNew={handleCreateNew}
            disabled={isCreating}
          />

          {/* Main Content Area */}
          <div className="space-y-6">
            <OrganizationContent
              isCreating={isCreating}
              selectedOrganization={selectedOrganization}
              isAdmin={isAdmin}
              isPending={isPending}
              userRole={userRole}
              userStatus={userStatus}
              currentUserId={currentUserId}
              onCreateSubmit={handleCreateSubmit}
              onCreateCancel={handleCreateCancel}
              onUpdate={handleOrganizationUpdate}
              onDelete={handleOrganizationDelete}
            />
          </div>
        </div>
      )}
    </div>
  );
}
