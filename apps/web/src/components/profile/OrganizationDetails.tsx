import { Building2, Copy, Pencil, Save, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  toast,
} from '@/components/ui';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { OrganizationApi } from '@/lib/api';
import type { Organization, OrganizationPayload } from '@/lib/api/types';
import { routes } from '@/lib/routes';

interface OrganizationDetailsProps {
  readonly organization: Organization;
  readonly isAdmin: boolean;
  readonly isPending: boolean;
  readonly userRole: 'ADMIN' | 'MEMBER' | null;
  readonly userStatus: 'ACTIVE' | 'PENDING' | null;
  readonly currentUserId: string;
  readonly onUpdate: (updated: Organization) => void;
  readonly onDelete: () => void;
  readonly disabled?: boolean;
}

export function OrganizationDetails({
  organization,
  isAdmin,
  isPending,
  userRole,
  userStatus,
  currentUserId,
  onUpdate,
  onDelete,
  disabled = false,
}: OrganizationDetailsProps) {
  const { t } = useTranslation();
  const { isCopied, copyToClipboard } = useCopyFeedback();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<OrganizationPayload>({ name: organization.name });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFeedback({ tone: 'error', text: t('organizations.messages.missingName') });
      return;
    }

    setBusy(true);
    setFeedback(null);
    const loadingToastId = toast.loading(t('organizations.messages.updating'));
    try {
      const updated = await OrganizationApi.updateOrganization(organization.id, form);
      onUpdate(updated);
      setIsEditing(false);
      toast.success(t('organizations.messages.updated'), { id: loadingToastId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      toast.error(t('organizations.messages.updateFailed', { error: errorMessage }), {
        id: loadingToastId,
      });
      setFeedback({ tone: 'error', text: errorMessage });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setBusy(true);
    setFeedback(null);
    const loadingToastId = toast.loading(t('organizations.messages.deleting'));
    try {
      await OrganizationApi.deleteOrganization(organization.id);
      toast.success(t('organizations.messages.deleted'), { id: loadingToastId });
      onDelete();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      toast.error(t('organizations.messages.deleteFailed', { error: errorMessage }), {
        id: loadingToastId,
      });
      setFeedback({ tone: 'error', text: errorMessage });
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarUpload = async (file: File, backgroundColor?: string | null) => {
    setBusy(true);
    setFeedback(null);
    const loadingToastId = toast.loading(t('organizations.messages.uploadingAvatar'));
    try {
      const updated = await OrganizationApi.uploadOrganizationAvatar(
        organization.id,
        file,
        backgroundColor
      );
      onUpdate(updated);
      toast.success(t('organizations.messages.avatarUploaded'), { id: loadingToastId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      toast.error(t('organizations.messages.avatarUploadFailed', { error: errorMessage }), {
        id: loadingToastId,
      });
      setFeedback({ tone: 'error', text: errorMessage });
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarDelete = async () => {
    setShowDeleteAvatarDialog(false);
    setBusy(true);
    setFeedback(null);
    const loadingToastId = toast.loading(t('organizations.messages.deletingAvatar'));
    try {
      const updated = await OrganizationApi.deleteOrganizationAvatar(organization.id);
      onUpdate(updated);
      toast.success(t('organizations.messages.avatarDeleted'), { id: loadingToastId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      toast.error(t('organizations.messages.avatarDeleteFailed', { error: errorMessage }), {
        id: loadingToastId,
      });
      setFeedback({ tone: 'error', text: errorMessage });
    } finally {
      setBusy(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <OrganizationAvatar
                organizationId={organization.id}
                name={organization.name}
                hasImage={Boolean(organization.image)}
                size="2xl"
                color="brand"
              />
            </div>
            <div className="min-w-0 flex-1">
              {isEditing && isAdmin ? (
                <div className="space-y-2">
                  <InputGroup>
                    <InputGroupAddon>
                      <Building2 className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      value={form.name}
                      onChange={(e) => setForm({ name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSave();
                        }
                        if (e.key === 'Escape') {
                          setIsEditing(false);
                          setForm({ name: organization.name });
                        }
                      }}
                      placeholder={t('organizations.form.name.placeholder')}
                      disabled={busy || disabled}
                      autoFocus
                    />
                  </InputGroup>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setForm({ name: organization.name });
                      }}
                      disabled={busy || disabled}
                      className="gap-2"
                    >
                      <X size={16} />
                      {t('common.cancel')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      loading={busy}
                      disabled={busy || disabled}
                      className="gap-2"
                    >
                      <Save size={16} />
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{organization.name}</CardTitle>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(true);
                          setForm({ name: organization.name });
                        }}
                        disabled={busy || disabled}
                        className="h-8 w-8 p-0"
                        title={t('organizations.details.rename')}
                      >
                        <Pencil size={16} />
                      </Button>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {t('organizations.details.created', {
                      date: new Date(organization.createdAt ?? '').toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }),
                    })}
                  </CardDescription>
                  {isAdmin && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const joinUrl = routes.organizationJoin.url({
                            id: organization.id,
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
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={busy || disabled}
                        className="gap-2"
                      >
                        <Trash2 size={16} />
                        {t('organizations.details.delete')}
                      </Button>
                    </div>
                  )}
                </>
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
                <Label className="text-base">{t('organizations.details.avatar.title')}</Label>
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
                  disabled={busy || disabled}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy || disabled}
                  className="gap-2"
                >
                  <Upload size={16} />
                  {organization.image
                    ? t('organizations.details.avatar.change')
                    : t('organizations.details.avatar.upload')}
                </Button>
                {organization.image && (
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteAvatarDialog(true)}
                    disabled={busy || disabled}
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
          organizationId={organization.id}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
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

      {/* Delete Organization Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('organizations.details.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('organizations.details.deleteDescription', { name: organization.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy} variant="destructive">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
