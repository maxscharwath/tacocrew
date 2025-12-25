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
  ButtonGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  toast,
} from '@tacocrew/ui-kit';
import { Copy, Pencil, Save, Trash2, Upload, X } from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OrganizationMembers } from '@/components/profile/OrganizationMembers';
import { OrganizationAvatar } from '@/components/shared/OrganizationAvatar';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import {
  useDeleteOrganization,
  useDeleteOrganizationAvatar,
  useOrganization,
  useUpdateOrganization,
  useUploadOrganizationAvatar,
} from '@/lib/api/organization';
import type { Organization, OrganizationPayload } from '@/lib/api/types';
import { routes } from '@/lib/routes';

type OrganizationDetailsProps = Readonly<{
  organization: Organization;
  isAdmin: boolean;
  isPending: boolean;
  userRole: 'ADMIN' | 'MEMBER' | null;
  userStatus: 'ACTIVE' | 'PENDING' | null;
  currentUserId: string;
  onUpdate: (updated: Organization) => void;
  onDelete: () => void;
  disabled?: boolean;
}>;

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
  
  // Subscribe to organization detail query to get updates from mutations
  const organizationQuery = useOrganization(organization.id);
  const displayOrganization = organizationQuery.data ?? organization;
  
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<OrganizationPayload>({ name: displayOrganization.name });
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useUpdateOrganization();
  const deleteMutation = useDeleteOrganization();
  const uploadAvatarMutation = useUploadOrganizationAvatar();
  const deleteAvatarMutation = useDeleteOrganizationAvatar();

  // Update form when organization data refreshes
  useEffect(() => {
    if (!isEditing) {
      setForm({ name: displayOrganization.name });
    }
  }, [displayOrganization.name, isEditing]);

  const handleSave = () => {
    if (!form.name.trim()) {
      setFeedback({ tone: 'error', text: t('organizations.messages.missingName') });
      return;
    }

    setFeedback(null);
    const loadingToastId = toast.loading(t('organizations.messages.updating'));
    updateMutation.mutate(
      { organizationId: displayOrganization.id, body: form },
      {
        onSuccess: (updated) => {
          onUpdate(updated);
          setIsEditing(false);
          toast.success(t('organizations.messages.updated'), { id: loadingToastId });
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : t('organizations.messages.genericError');
          toast.error(t('organizations.messages.updateFailed', { error: errorMessage }), {
            id: loadingToastId,
          });
          setFeedback({ tone: 'error', text: errorMessage });
        },
      }
    );
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    setFeedback(null);
    const loadingToastId = toast.loading(t('organizations.messages.deleting'));
    deleteMutation.mutate(displayOrganization.id, {
      onSuccess: () => {
        toast.success(t('organizations.messages.deleted'), { id: loadingToastId });
        onDelete();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : t('organizations.messages.genericError');
        toast.error(t('organizations.messages.deleteFailed', { error: errorMessage }), {
          id: loadingToastId,
        });
        setFeedback({ tone: 'error', text: errorMessage });
      },
    });
  };

  const handleAvatarUpload = (file: File, backgroundColor?: string | null) => {
    setFeedback(null);
    const loadingToastId = toast.loading(t('organizations.messages.uploadingAvatar'));
    uploadAvatarMutation.mutate(
      {
        organizationId: displayOrganization.id,
        imageFile: file,
        backgroundColor: backgroundColor ?? undefined,
      },
      {
        onSuccess: (updated) => {
          onUpdate(updated);
          toast.success(t('organizations.messages.avatarUploaded'), { id: loadingToastId });
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : t('organizations.messages.genericError');
          toast.error(t('organizations.messages.avatarUploadFailed', { error: errorMessage }), {
            id: loadingToastId,
          });
          setFeedback({ tone: 'error', text: errorMessage });
        },
        onSettled: () => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      }
    );
  };

  const handleAvatarDelete = () => {
    setShowDeleteAvatarDialog(false);
    setFeedback(null);
    const loadingToastId = toast.loading(t('organizations.messages.deletingAvatar'));
    deleteAvatarMutation.mutate(displayOrganization.id, {
      onSuccess: (updated) => {
        onUpdate(updated);
        toast.success(t('organizations.messages.avatarDeleted'), { id: loadingToastId });
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : t('organizations.messages.genericError');
        toast.error(t('organizations.messages.avatarDeleteFailed', { error: errorMessage }), {
          id: loadingToastId,
        });
        setFeedback({ tone: 'error', text: errorMessage });
      },
    });
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const busy =
    updateMutation.isPending ||
    deleteMutation.isPending ||
    uploadAvatarMutation.isPending ||
    deleteAvatarMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <OrganizationAvatar
                organizationId={displayOrganization.id}
                name={displayOrganization.name}
                size="2xl"
                color="brand"
                imageUrl={displayOrganization.image}
              />
            </div>
            <div className="min-w-0 flex-1">
              {isEditing && isAdmin ? (
                <ButtonGroup className="w-full">
                  <Input
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setForm({ name: organization.name });
                    }}
                    disabled={busy || disabled}
                    aria-label={t('common.cancel')}
                  >
                    <X size={16} />
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleSave}
                    loading={updateMutation.isPending}
                    disabled={busy || disabled}
                    aria-label={t('common.save')}
                  >
                    <Save size={16} />
                  </Button>
                </ButtonGroup>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{displayOrganization.name}</CardTitle>
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
                      date: new Date(displayOrganization.createdAt ?? '').toLocaleDateString(undefined, {
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
                            id: displayOrganization.id,
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
                        variant="destructive"
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
                  {displayOrganization.image
                    ? t('organizations.details.avatar.change')
                    : t('organizations.details.avatar.upload')}
                </Button>
                {displayOrganization.image && (
                  <Button
                    variant="destructive"
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
          organizationId={displayOrganization.id}
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
              {t('organizations.details.deleteDescription', { name: displayOrganization.name })}
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
