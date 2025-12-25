import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  toast,
} from '@tacocrew/ui-kit';
import { Check, Crown, Mail, User, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RoleSelector } from '@/components/profile/RoleSelector';
import { UserAvatar } from '@/components/shared/UserAvatar';
import {
  useAcceptJoinRequest,
  useAddUserToOrganization,
  useOrganizationMembers,
  usePendingRequests,
  useRejectJoinRequest,
  useRemoveUserFromOrganization,
  useRequestToJoinOrganization,
  useUpdateUserRole,
} from '@/lib/api/organization';
import type { OrganizationMember, OrganizationRole, PendingRequest } from '@/lib/api/types';

type OrganizationMembersProps = Readonly<{
  organizationId: string;
  isAdmin: boolean;
  currentUserId: string;
}>;

export function OrganizationMembers({
  organizationId,
  isAdmin,
  currentUserId,
}: OrganizationMembersProps) {
  const { t } = useTranslation();
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserRole, setAddUserRole] = useState<OrganizationRole>('MEMBER');

  const membersQuery = useOrganizationMembers(organizationId);
  const pendingRequestsQuery = usePendingRequests(organizationId, isAdmin);
  const acceptRequestMutation = useAcceptJoinRequest();
  const rejectRequestMutation = useRejectJoinRequest();
  const updateRoleMutation = useUpdateUserRole();
  const removeMemberMutation = useRemoveUserFromOrganization();
  const requestToJoinMutation = useRequestToJoinOrganization();
  const addUserMutation = useAddUserToOrganization();

  const members = membersQuery.data ?? [];
  const pendingRequests = pendingRequestsQuery.data ?? [];
  const loading = membersQuery.isLoading || pendingRequestsQuery.isLoading;
  const error = membersQuery.error ?? pendingRequestsQuery.error;

  const handleAcceptRequest = (userId: string) => {
    const user = pendingRequests.find((r) => r.userId === userId);
    const userName = user?.user.name || t('organizations.members.user');

    acceptRequestMutation.mutate(
      { organizationId, userId },
      {
        onSuccess: () => {
          toast.success(t('organizations.members.requestAcceptedWithName', { name: userName }));
        },
        onError: (err) => {
          const errorMessage =
            err instanceof Error ? err.message : t('organizations.messages.genericError');
          toast.error(t('organizations.members.requestAcceptFailed', { error: errorMessage }));
        },
      }
    );
  };

  const handleRejectRequest = (userId: string) => {
    const user = pendingRequests.find((r) => r.userId === userId);
    const userName = user?.user.name || t('organizations.members.user');

    rejectRequestMutation.mutate(
      { organizationId, userId },
      {
        onSuccess: () => {
          toast.success(t('organizations.members.requestRejectedWithName', { name: userName }));
        },
        onError: (err) => {
          const errorMessage =
            err instanceof Error ? err.message : t('organizations.messages.genericError');
          toast.error(t('organizations.members.requestRejectFailed', { error: errorMessage }));
        },
      }
    );
  };

  const handleUpdateRole = (userId: string, newRole: OrganizationRole) => {
    const member = members.find((m) => m.userId === userId);
    const userName = member?.user.name || t('organizations.members.user');
    const roleName =
      newRole === 'ADMIN' ? t('organizations.roles.admin') : t('organizations.roles.member');

    updateRoleMutation.mutate(
      { organizationId, userId, role: newRole },
      {
        onSuccess: () => {
          toast.success(
            t('organizations.members.roleUpdatedWithDetails', { name: userName, role: roleName })
          );
        },
        onError: (err) => {
          const errorMessage =
            err instanceof Error ? err.message : t('organizations.messages.genericError');
          toast.error(t('organizations.members.roleUpdateFailed', { error: errorMessage }));
        },
      }
    );
  };

  const handleRemoveMember = (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    const userName = member?.user.name || t('organizations.members.user');

    if (!confirm(t('organizations.members.confirmRemoveWithName', { name: userName }))) return;

    removeMemberMutation.mutate(
      { organizationId, userId },
      {
        onSuccess: () => {
          toast.success(t('organizations.members.memberRemovedWithName', { name: userName }));
        },
        onError: (err) => {
          const errorMessage =
            err instanceof Error ? err.message : t('organizations.messages.genericError');
          toast.error(t('organizations.members.memberRemoveFailed', { error: errorMessage }));
        },
      }
    );
  };

  const handleRequestToJoin = () => {
    requestToJoinMutation.mutate(organizationId, {
      onSuccess: () => {
        toast.success(t('organizations.members.joinRequested'));
      },
      onError: (err) => {
        const errorMessage =
          err instanceof Error ? err.message : t('organizations.messages.genericError');
        if (err instanceof Error && err.message.includes('already')) {
          toast.error(err.message);
        } else {
          toast.error(t('organizations.members.joinRequestFailed', { error: errorMessage }));
        }
      },
    });
  };

  const handleAddUser = () => {
    if (!addUserEmail.trim()) {
      toast.error(t('organizations.members.addUser.emailRequired'));
      return;
    }

    addUserMutation.mutate(
      { organizationId, email: addUserEmail.trim(), role: addUserRole },
      {
        onSuccess: () => {
          toast.success(t('organizations.members.addUser.success', { email: addUserEmail.trim() }));
          setAddUserEmail('');
          setAddUserRole('MEMBER');
        },
        onError: (err) => {
          const errorMessage =
            err instanceof Error ? err.message : t('organizations.messages.genericError');
          toast.error(t('organizations.members.addUser.failed', { error: errorMessage }));
        },
      }
    );
  };

  const busy =
    acceptRequestMutation.isPending ||
    rejectRequestMutation.isPending ||
    updateRoleMutation.isPending ||
    removeMemberMutation.isPending ||
    requestToJoinMutation.isPending ||
    addUserMutation.isPending;

  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const currentUserMember = activeMembers.find((m) => m.userId === currentUserId);
  const isMember = Boolean(currentUserMember);
  const hasPendingRequest = pendingRequests.some((r) => r.userId === currentUserId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-slate-400">{t('common.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert tone="error">
            <p>
              {error instanceof Error ? error.message : t('organizations.messages.genericError')}
            </p>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests (Admin Only) */}
      {isAdmin && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail size={20} />
              {t('organizations.members.pendingRequests')}
              <Badge tone="warning" pill>
                {pendingRequests.length}
              </Badge>
            </CardTitle>
            <CardDescription>{t('organizations.members.pendingDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.userId}
                className="flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-500/10 p-4"
              >
                <div className="flex items-center gap-4">
                  <UserAvatar
                    userId={request.user.id}
                    name={request.user.name}
                    size="md"
                    alt={request.user.name}
                  />
                  <div>
                    <p className="font-medium text-sm text-white">{request.user.name}</p>
                    <p className="mt-0.5 text-slate-400 text-xs">{request.user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAcceptRequest(request.userId)}
                    disabled={busy}
                    className="gap-2"
                  >
                    <Check size={14} />
                    {t('common.accept')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRejectRequest(request.userId)}
                    disabled={busy}
                    className="gap-2"
                  >
                    <X size={14} />
                    {t('common.reject')}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Join Request Button (Non-members) */}
      {!isMember && !hasPendingRequest && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{t('organizations.members.notMember')}</p>
                <p className="text-slate-400 text-sm">{t('organizations.members.requestToJoin')}</p>
              </div>
              <Button onClick={handleRequestToJoin} disabled={busy} className="gap-2">
                <UserPlus size={16} />
                {t('organizations.members.requestJoin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Status (User has requested) */}
      {hasPendingRequest && (
        <Card>
          <CardContent className="py-6">
            <Alert tone="info">
              <p>{t('organizations.members.requestPending')}</p>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Add User (Admin Only) */}
      {isAdmin && (
        <Card className="border-brand-400/20 bg-brand-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus size={20} />
              {t('organizations.members.addUser.title')}
            </CardTitle>
            <CardDescription>{t('organizations.members.addUser.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="add-user-email" className="text-sm">
                  {t('organizations.members.addUser.emailLabel')}
                </Label>
                <InputGroup>
                  <InputGroupAddon>
                    <Mail size={16} />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="add-user-email"
                    type="email"
                    placeholder={t('organizations.members.addUser.emailPlaceholder')}
                    value={addUserEmail}
                    onChange={(e) => setAddUserEmail(e.target.value)}
                    disabled={addUserMutation.isPending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !addUserMutation.isPending && addUserEmail.trim()) {
                        handleAddUser();
                      }
                    }}
                  />
                </InputGroup>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-user-role" className="text-sm">
                  {t('organizations.members.addUser.roleLabel')}
                </Label>
                <RoleSelector
                  id="add-user-role"
                  value={addUserRole}
                  onValueChange={setAddUserRole}
                  disabled={addUserMutation.isPending}
                  triggerClassName="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddUser}
                  disabled={addUserMutation.isPending || !addUserEmail.trim()}
                  loading={addUserMutation.isPending}
                  className="gap-2"
                  variant="default"
                >
                  <UserPlus size={16} />
                  {t('organizations.members.addUser.button')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
            {t('organizations.members.title')}
            <Badge tone="neutral" pill>
              {activeMembers.length}
            </Badge>
          </CardTitle>
          <CardDescription>{t('organizations.members.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {activeMembers.length === 0 ? (
            <EmptyState
              icon={User}
              title={t('organizations.members.empty')}
              description={t('organizations.members.emptyDescription')}
            />
          ) : (
            <div className="space-y-2">
              {activeMembers.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const canManage = isAdmin && !isCurrentUser;

                return (
                  <div
                    key={member.userId}
                    className={`flex items-center justify-between rounded-xl border p-4 ${
                      isCurrentUser
                        ? 'border-brand-400/40 bg-brand-500/10'
                        : 'border-white/10 bg-slate-900/30'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <UserAvatar
                        userId={member.user.id}
                        name={member.user.name}
                        size="md"
                        alt={member.user.name}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-sm text-white">
                            {member.user.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-slate-400 text-xs">
                                ({t('common.you')})
                              </span>
                            )}
                          </p>
                          <Badge
                            tone={member.role === 'ADMIN' ? 'brand' : 'neutral'}
                            className="flex shrink-0 items-center gap-1"
                          >
                            {member.role === 'ADMIN' && <Crown size={12} />}
                            {member.role === 'ADMIN'
                              ? t('organizations.roles.admin')
                              : t('organizations.roles.member')}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-slate-400 text-xs">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <RoleSelector
                          value={member.role}
                          onValueChange={(value) => handleUpdateRole(member.userId, value)}
                          disabled={busy}
                          triggerClassName="w-auto min-w-[140px]"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={busy}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
