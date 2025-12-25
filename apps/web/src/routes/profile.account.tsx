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
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  PhoneInput,
  toast,
} from '@tacocrew/ui-kit';
import { Edit, Globe, Key, Laptop, Lock, Mail, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ImageUploader } from '@/components/profile/ImageUploader';
import { PushNotificationManager } from '@/components/profile/PushNotificationManager';
import { EditActionButtons } from '@/components/shared';
import { usePasskeys } from '@/hooks/usePasskeys';
import { useProfile, useUpdateUserPhone } from '@/lib/api/user';
import { authClient, useSession } from '@/lib/auth-client';
import { ENV } from '@/lib/env';
import { formatPhoneNumber } from '@/utils/phone-formatter';

// Reusable hook for editable field logic
function useEditableField<T extends string | null | undefined>(
  currentValue: T,
  onUpdate: (value: T) => Promise<void>,
  defaultValue: string = ''
) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue ?? defaultValue);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(currentValue ?? defaultValue);
  }, [currentValue, defaultValue]);

  const handleSave = async (transformedValue?: T) => {
    setIsSaving(true);
    try {
      await onUpdate(transformedValue ?? (value as T));
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(currentValue ?? defaultValue);
    setIsEditing(false);
  };

  const startEditing = () => setIsEditing(true);

  return {
    isEditing,
    isSaving,
    value,
    setValue,
    handleSave,
    handleCancel,
    startEditing,
  };
}

function PhoneEditor({
  currentPhone,
  onUpdate,
}: Readonly<{
  currentPhone: string | null | undefined;
  onUpdate: (phone: string | null) => Promise<void>;
}>) {
  const { t } = useTranslation();
  const {
    isEditing,
    isSaving,
    value: phone,
    setValue: setPhone,
    handleSave,
    handleCancel,
    startEditing,
  } = useEditableField(currentPhone, async () => {
    await onUpdate(phone.trim() || null);
  });

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 font-medium text-slate-200 text-sm">
          <Avatar color="emerald" size="sm">
            <Phone />
          </Avatar>
          {t('account.profile.phone')}
        </label>
        <div className="flex items-center gap-2">
          <PhoneInput
            value={phone}
            onChange={setPhone}
            defaultCountry="CH"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            disabled={isSaving}
            className="flex-1"
          />
          <EditActionButtons
            isSaving={isSaving}
            onSave={() => void handleSave()}
            onCancel={handleCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 font-medium text-slate-200 text-sm">
        <Avatar color="emerald" size="sm">
          <Phone />
        </Avatar>
        {t('account.profile.phone')}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-white">
          {currentPhone ? formatPhoneNumber(currentPhone) : t('account.profile.phoneNotSet')}
        </div>
        <Button onClick={startEditing} variant="outline" size="sm" className="gap-2">
          <Edit size={14} />
          {t('account.edit')}
        </Button>
      </div>
    </div>
  );
}

function NameEditor({
  currentName,
  onUpdate,
}: Readonly<{
  currentName: string;
  onUpdate: (name: string) => Promise<void>;
}>) {
  const { t } = useTranslation();
  const {
    isEditing,
    isSaving,
    value: name,
    setValue: setName,
    handleSave,
    handleCancel,
    startEditing,
  } = useEditableField(currentName, async () => {
    if (name.trim()) {
      await onUpdate(name.trim());
    }
  });

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 font-medium text-slate-200 text-sm">
          <Avatar color="blue" size="sm">
            <User />
          </Avatar>
          {t('account.profile.name')}
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            autoFocus
            disabled={isSaving}
            className="flex-1"
          />
          <EditActionButtons
            isSaving={isSaving}
            onSave={() => void handleSave()}
            onCancel={handleCancel}
            saveDisabled={!name.trim()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 font-medium text-slate-200 text-sm">
        <Avatar color="blue" size="sm">
          <User />
        </Avatar>
        {t('account.profile.name')}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-white">{currentName}</div>
        <Button onClick={startEditing} variant="outline" size="sm" className="gap-2">
          <Edit size={14} />
          {t('account.edit')}
        </Button>
      </div>
    </div>
  );
}

function PasskeyNameEditor({
  currentName,
  onUpdate,
  placeholder,
}: Readonly<{
  currentName?: string;
  onUpdate: (name: string) => Promise<void>;
  placeholder: string;
}>) {
  const { t } = useTranslation();
  const {
    isEditing,
    isSaving,
    value: name,
    setValue: setName,
    handleSave,
    handleCancel,
    startEditing,
  } = useEditableField(currentName, async () => {
    await onUpdate(name.trim() || placeholder);
  });

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              void handleSave();
            } else if (e.key === 'Escape') {
              handleCancel();
            }
          }}
          autoFocus
          disabled={isSaving}
          placeholder={placeholder}
          className="flex-1 text-sm"
        />
        <EditActionButtons
          isSaving={isSaving}
          onSave={() => void handleSave()}
          onCancel={handleCancel}
          size="xs"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-white">{currentName || placeholder}</span>
      <Button
        onClick={startEditing}
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        title={t('account.passkeys.rename')}
        aria-label={t('account.passkeys.rename')}
      >
        <Edit className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function accountLoader() {
  return Response.json({});
}

export function AccountRoute() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const profileQuery = useProfile();
  const passkeysQuery = usePasskeys();
  const updatePhone = useUpdateUserPhone();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showDeletePasskeyDialog, setShowDeletePasskeyDialog] = useState<string | null>(null);

  const isLoading = profileQuery.isLoading || passkeysQuery.isLoading;
  const profile = profileQuery.data ?? null;
  const passkeys = passkeysQuery.data ?? [];

  const handleRegisterPasskey = async () => {
    try {
      setIsRegistering(true);

      const deviceName = `${t('account.passkeys.deviceNamePrefix')} ${new Date().toLocaleDateString()}`;

      // Use Better Auth's passkey.addPasskey() method which handles the entire flow
      const result = await authClient.passkey.addPasskey({
        name: deviceName,
      });

      if (result?.error) {
        toast.error(result.error.message || t('account.passkeys.registerFailed'));
        setIsRegistering(false);
        return;
      }

      toast.success(t('account.passkeys.registerSuccess'));

      // Refetch passkeys after successful registration
      await passkeysQuery.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('account.passkeys.registerFailed'));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeletePasskey = (passkeyId: string) => {
    setShowDeletePasskeyDialog(passkeyId);
  };

  const handleConfirmDeletePasskey = async () => {
    const passkeyId = showDeletePasskeyDialog;
    if (!passkeyId) return;

    setShowDeletePasskeyDialog(null);

    try {
      const response = await fetch(`${ENV.apiBaseUrl}/api/auth/passkey/delete-passkey`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: passkeyId }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result?.error?.message || t('account.passkeys.deleteFailed');
        toast.error(errorMessage);
        return;
      }

      if (result && typeof result === 'object' && result.error) {
        const errorMessage = result.error.message || t('account.passkeys.deleteFailed');
        toast.error(errorMessage);
        return;
      }

      if (response.ok && (result === null || result.success !== false)) {
        toast.success(t('account.passkeys.deleteSuccess'));
      } else {
        toast.error(t('account.passkeys.deleteFailed'));
        return;
      }

      // Refetch passkeys list after deletion
      await passkeysQuery.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('account.passkeys.deleteFailed'));
    }
  };

  const handleUpdatePasskeyName = async (passkeyId: string, newName: string) => {
    try {
      const response = await fetch(`${ENV.apiBaseUrl}/api/auth/passkey/update-passkey`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: passkeyId, name: newName }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error?.message || t('account.passkeys.updateFailed'));
        return;
      }

      toast.success(t('account.passkeys.updateSuccess'));

      // Refetch passkeys to get updated list
      await passkeysQuery.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('account.passkeys.updateFailed'));
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType.toLowerCase();
    if (type.includes('phone') || type.includes('mobile') || type.includes('tablet')) {
      return Phone;
    }
    if (type.includes('laptop') || type.includes('computer') || type.includes('desktop')) {
      return Laptop;
    }
    // For other devices, use Lock (security key icon)
    return Lock;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-400">{t('account.loading')}</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div>
        <h1 className="font-semibold text-2xl text-white">{t('account.title')}</h1>
        <p className="mt-2 text-slate-400 text-sm">{t('account.subtitle')}</p>
      </div>

      {/* Profile Image */}
      <div className="rounded-2xl border border-white/10 bg-linear-to-br from-slate-950/70 via-slate-900/60 to-slate-900/40 p-3 shadow-xl sm:p-5">
        <div className="flex flex-col gap-2 text-white">
          <p className="font-semibold">{t('account.avatar.title') || 'Profile Picture'}</p>
          <p className="text-slate-400 text-sm">
            {t('account.avatar.description') ||
              'Upload a profile picture to personalize your account'}
          </p>
        </div>
        <div className="mt-3">
          <ImageUploader
            currentImage={profile?.image || null}
            onImageUpdate={async () => {
              await profileQuery.refetch();
            }}
          />
        </div>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('account.profile.title')}</CardTitle>
          <CardDescription>{t('account.profile.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <NameEditor
              currentName={session.user.name}
              onUpdate={async (newName) => {
                try {
                  const result = await authClient.updateUser({
                    name: newName,
                  });
                  if (result.error) {
                    toast.error(result.error.message || t('account.nameUpdate.failed'));
                    return;
                  }
                  toast.success(t('account.nameUpdate.success'));
                  await profileQuery.refetch();
                  globalThis.dispatchEvent(new CustomEvent('userNameUpdated'));
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : t('account.nameUpdate.failed'));
                }
              }}
            />
            <div className="space-y-2 border-white/10 border-t pt-4">
              <label className="flex items-center gap-2 font-medium text-slate-200 text-sm">
                <Avatar color="emerald" size="sm">
                  <Mail />
                </Avatar>
                {t('account.profile.email')}
              </label>
              <div className="flex items-center gap-3">
                <span className="text-white">{session.user.email}</span>
                {session.user.emailVerified ? (
                  <Badge tone="success" pill>
                    {t('account.profile.verified')}
                  </Badge>
                ) : (
                  <Badge tone="warning" pill>
                    {t('account.profile.unverified')}
                  </Badge>
                )}
              </div>
            </div>
            <PhoneEditor
              currentPhone={profile?.phone}
              onUpdate={async (newPhone) => {
                return new Promise<void>((resolve, reject) => {
                  updatePhone.mutate(newPhone, {
                    onSuccess: () => {
                      toast.success(t('account.phoneUpdate.success'));
                      resolve();
                    },
                    onError: (err) => {
                      toast.error(
                        err instanceof Error ? err.message : t('account.phoneUpdate.failed')
                      );
                      reject(err);
                    },
                  });
                });
              }}
            />
            <div className="space-y-2 border-white/10 border-t pt-4">
              <label className="flex items-center gap-2 font-medium text-slate-200 text-sm">
                <Avatar color="indigo" size="sm">
                  <Globe />
                </Avatar>
                {t('account.profile.language')}
              </label>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passkeys */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('account.passkeys.title')}</CardTitle>
              <CardDescription>{t('account.passkeys.description')}</CardDescription>
            </div>
            <Button
              onClick={handleRegisterPasskey}
              disabled={isRegistering}
              variant="default"
              size="sm"
              loading={isRegistering}
              className="w-full sm:w-auto"
            >
              {t('account.passkeys.addButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {passkeys.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Key}
                  title={t('account.passkeys.emptyState.title')}
                  description={t('account.passkeys.emptyState.description')}
                />
              </div>
            ) : (
              passkeys.map((passkey) => {
                const DeviceIcon = getDeviceIcon(passkey.deviceType);
                return (
                  <div
                    key={passkey.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-800/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700/50">
                        <DeviceIcon className="h-5 w-5 text-slate-300" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <PasskeyNameEditor
                          currentName={passkey.name}
                          onUpdate={async (newName) => {
                            await handleUpdatePasskeyName(passkey.id, newName);
                          }}
                          placeholder={passkey.deviceType || t('account.passkeys.unnamed')}
                        />
                        <div className="mt-1 truncate text-slate-400 text-sm">
                          {passkey.deviceType} • {t('account.passkeys.registered')}{' '}
                          {new Date(passkey.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:ml-2">
                      <Button
                        onClick={() => handleDeletePasskey(passkey.id)}
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        {t('account.passkeys.delete')}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Alert tone="info" title={t('account.passkeys.about.title')} className="mt-4">
            {t('account.passkeys.about.description')}
          </Alert>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <PushNotificationManager />

      {/* Delete Passkey Confirmation Dialog */}
      <AlertDialog
        open={showDeletePasskeyDialog !== null}
        onOpenChange={(open) => !open && setShowDeletePasskeyDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('account.passkeys.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('account.passkeys.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeletePasskey}>
              {t('account.passkeys.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
