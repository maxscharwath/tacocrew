import { Building2, Check, Copy, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OrganizationMembers } from '@/components/profile/OrganizationMembers';
import { OrganizationAvatar } from '@/components/shared/OrganizationAvatar';
import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
} from '@/components/ui';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { OrganizationApi, UserApi } from '@/lib/api';
import type { Organization, OrganizationPayload } from '@/lib/api/types';
import { routes } from '@/lib/routes';

interface OrganizationsManagerProps {
  readonly organizations: Organization[];
}

export function OrganizationsManager({
  organizations: initialOrganizations,
}: OrganizationsManagerProps) {
  const { t } = useTranslation();
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [selectedId, setSelectedId] = useState<string>(organizations[0]?.id ?? '');
  const [form, setForm] = useState<OrganizationPayload>({ name: '' });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  const [userStatus, setUserStatus] = useState<'ACTIVE' | 'PENDING' | null>(null);
  const { isCopied, copyToClipboard } = useCopyFeedback();

  const selectedOrganization = organizations.find((org) => org.id === selectedId);

  // Load current user ID and role
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
      // Get role and status from the organizations list
      const org = organizations.find((o) => o.id === selectedId);
      if (org && org.role && org.status) {
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
    const org = orgId ? organizations.find((item) => item.id === orgId) : null;
    setForm(org ? { name: org.name } : { name: '' });
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setForm({ name: '' });
    setSelectedId('');
    setIsCreating(true);
    setFeedback(null);
  };

  const validate = () => {
    if (!form.name.trim()) {
      setFeedback({ tone: 'error', text: t('organizations.messages.missingName') });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setBusy(true);
    setFeedback(null);
    try {
      if (isCreating) {
        toast.loading(t('organizations.messages.creating'));
        const newOrg = await OrganizationApi.createOrganization(form);
        setOrganizations((prev) => [...prev, newOrg]);
        setSelectedId(newOrg.id);
        setIsCreating(false);
        toast.success(t('organizations.messages.createdWithName', { name: newOrg.name }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      toast.error(t('organizations.messages.createFailed', { error: errorMessage }));
      setFeedback({ tone: 'error', text: errorMessage });
    } finally {
      setBusy(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false);

  const handleAvatarUpload = async (file: File, backgroundColor?: string | null) => {
    if (!selectedId) return;
    setBusy(true);
    setFeedback(null);
    try {
      toast.loading(t('organizations.messages.uploadingAvatar'));
      const updated = await OrganizationApi.uploadOrganizationAvatar(
        selectedId,
        file,
        backgroundColor
      );
      setOrganizations((prev) => prev.map((org) => (org.id === selectedId ? updated : org)));
      toast.success(t('organizations.messages.avatarUploaded'));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      toast.error(t('organizations.messages.avatarUploadFailed', { error: errorMessage }));
      setFeedback({ tone: 'error', text: errorMessage });
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!selectedId) return;
    setShowDeleteAvatarDialog(false);
    setBusy(true);
    setFeedback(null);
    try {
      toast.loading(t('organizations.messages.deletingAvatar'));
      const updated = await OrganizationApi.deleteOrganizationAvatar(selectedId);
      setOrganizations((prev) => prev.map((org) => (org.id === selectedId ? updated : org)));
      toast.success(t('organizations.messages.avatarDeleted'));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      toast.error(t('organizations.messages.avatarDeleteFailed', { error: errorMessage }));
      setFeedback({ tone: 'error', text: errorMessage });
    } finally {
      setBusy(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedId) {
      handleAvatarUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('organizations.list.title')}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateNew}
                  className="h-8 w-8 p-0"
                  disabled={busy || isCreating}
                  title={t('organizations.list.add')}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-200 ${
                      org.id === selectedId
                        ? 'border-brand-400/60 bg-brand-500/15 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]'
                        : 'border-white/5 bg-slate-900/30 text-slate-300 hover:border-brand-400/30 hover:bg-slate-800/50 hover:text-white'
                    }`}
                    onClick={() => selectOrganization(org.id)}
                    disabled={busy}
                  >
                    <OrganizationAvatar
                      organizationId={org.id}
                      name={org.name}
                      hasImage={Boolean(org.image)}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{org.name}</p>
                    </div>
                    {org.id === selectedId && (
                      <Check size={16} className="shrink-0 text-brand-400" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Organization Details */}
          <div className="space-y-6">
            {isCreating ? (
              /* Create Form */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus size={20} />
                    {t('organizations.form.create')}
                  </CardTitle>
                  <CardDescription>{t('organizations.empty.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {feedback && (
                    <Alert tone={feedback.tone}>
                      <p className="text-sm">{feedback.text}</p>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="org-name" className="text-base">
                      {t('organizations.form.name.label')}
                    </Label>
                    <InputGroup>
                      <InputGroupAddon>
                        <Building2 className="size-4" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="org-name"
                        value={form.name}
                        onChange={(e) => setForm({ name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSave();
                          }
                        }}
                        placeholder={t('organizations.form.name.placeholder')}
                        disabled={busy}
                        autoFocus
                      />
                    </InputGroup>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      loading={busy}
                      disabled={busy}
                      size="lg"
                      className="flex-1 gap-2"
                    >
                      <Check size={16} />
                      {t('organizations.form.create')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsCreating(false);
                        setForm({ name: '' });
                        setSelectedId(organizations[0]?.id ?? '');
                        setFeedback(null);
                      }}
                      disabled={busy}
                      size="lg"
                      className="gap-2"
                    >
                      <X size={16} />
                      {t('common.cancel')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedOrganization ? (
              <>
                {/* Organization Details */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-6">
                      <div className="shrink-0">
                        <OrganizationAvatar
                          organizationId={selectedOrganization.id}
                          name={selectedOrganization.name}
                          hasImage={Boolean(selectedOrganization.image)}
                          size="2xl"
                          color="brand"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-2xl">{selectedOrganization.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {t('organizations.details.created', {
                            date: new Date(selectedOrganization.createdAt ?? '').toLocaleDateString(
                              undefined,
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            ),
                          })}
                        </CardDescription>
                        {isAdmin && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const joinUrl = routes.organizationJoin.url({
                                  id: selectedOrganization.id,
                                });
                                copyToClipboard(joinUrl);
                                toast.success(t('organizations.join.linkCopied'));
                              }}
                              className="gap-2"
                            >
                              <Copy size={16} />
                              {isCopied
                                ? t('organizations.join.linkCopied')
                                : t('organizations.join.copyLink')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {feedback && (
                      <Alert tone={feedback.tone}>
                        <p className="text-sm">{feedback.text}</p>
                      </Alert>
                    )}

                    {/* Avatar Management Section (Admin Only) */}
                    {isAdmin && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base">
                            {t('organizations.details.avatar.title')}
                          </Label>
                          <p className="mt-1 text-slate-400 text-sm">
                            {t('organizations.details.avatar.description')}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={busy}
                          />
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={busy}
                            className="gap-2"
                          >
                            <Upload size={16} />
                            {selectedOrganization.image
                              ? t('organizations.details.avatar.change')
                              : t('organizations.details.avatar.upload')}
                          </Button>
                          {selectedOrganization.image && (
                            <Button
                              variant="danger"
                              onClick={() => setShowDeleteAvatarDialog(true)}
                              disabled={busy}
                              className="gap-2"
                            >
                              <Trash2 size={16} />
                              {t('organizations.details.avatar.delete')}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    {isPending && (
                      <Alert tone="warning">
                        <p className="text-sm">{t('organizations.members.requestPending')}</p>
                      </Alert>
                    )}
                    {!isAdmin && userRole === 'MEMBER' && userStatus === 'ACTIVE' && (
                      <Alert tone="info">
                        <p className="text-sm">{t('organizations.members.viewOnly')}</p>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Members Management - Only show for ACTIVE members */}
                {currentUserId && userStatus === 'ACTIVE' && (
                  <OrganizationMembers
                    organizationId={selectedOrganization.id}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                  />
                )}
              </>
            ) : (
              /* No Selection State */
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Building2}
                    title={t('organizations.empty.select')}
                    description={t('organizations.empty.selectDescription')}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Delete Avatar Confirmation Dialog */}
      <AlertDialog open={showDeleteAvatarDialog} onOpenChange={setShowDeleteAvatarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('organizations.details.avatar.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('organizations.details.avatar.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleAvatarDelete} disabled={busy} variant="destructive">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
