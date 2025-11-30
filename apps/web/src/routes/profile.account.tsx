import {
  Bell,
  Check,
  Edit,
  Globe,
  Key,
  Laptop,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  User,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LoaderFunctionArgs, redirect } from 'react-router';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ImageUploader } from '@/components/profile/ImageUploader';
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
} from '@/components/ui';
import { usePushNotifications } from '@/hooks';
import {
  deletePushSubscription,
  getPushSubscriptions,
  type PushSubscriptionInfo,
  sendTestNotification,
} from '@/lib/api/push-notifications';
import type { UserProfile } from '@/lib/api/types';
import { getProfile, updateUserPhone } from '@/lib/api/user';
import { authClient, useSession } from '@/lib/auth-client';
import { ENV } from '@/lib/env';
import { routes } from '@/lib/routes';
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
    setValue((currentValue ?? defaultValue) as string);
  }, [currentValue, defaultValue]);

  const handleSave = useCallback(async (transformedValue?: T) => {
    setIsSaving(true);
    try {
      await onUpdate(transformedValue ?? value as T);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [onUpdate, value]);

  const handleCancel = useCallback(() => {
    setValue((currentValue ?? defaultValue) as string);
    setIsEditing(false);
  }, [currentValue, defaultValue]);

  const startEditing = useCallback(() => setIsEditing(true), []);

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

// Reusable edit action buttons
function EditActionButtons({
  isSaving,
  onSave,
  onCancel,
  saveDisabled,
  size = 'sm',
}: Readonly<{
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  saveDisabled?: boolean;
  size?: 'sm' | 'xs';
}>) {
  const { t } = useTranslation();
  const buttonClass = size === 'sm' ? 'h-11 w-11 p-0' : 'h-9 w-9 p-0';
  const iconSize = size === 'sm' ? 16 : 14;

  return (
    <>
      <Button
        onClick={onSave}
        disabled={isSaving || saveDisabled}
        variant="primary"
        size="sm"
        className={buttonClass}
        title={isSaving ? t('account.saving') : t('account.save')}
      >
        {isSaving ? <RefreshCw size={iconSize} className="animate-spin" /> : <Check size={iconSize} />}
      </Button>
      <Button
        onClick={onCancel}
        disabled={isSaving}
        variant="outline"
        size="sm"
        className={buttonClass}
        title={t('account.cancel')}
      >
        <X size={iconSize} />
      </Button>
    </>
  );
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

type Passkey = {
  id: string;
  name?: string;
  deviceType: string;
  createdAt: string;
};

export async function accountLoader(_: LoaderFunctionArgs) {
  const session = await authClient.getSession();
  if (!session?.data) {
    throw redirect(routes.signin());
  }
  return null;
}

export function AccountRoute() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [pushSubscriptions, setPushSubscriptions] = useState<PushSubscriptionInfo[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const isLoadingRef = useRef(false);
  const [showDeletePasskeyDialog, setShowDeletePasskeyDialog] = useState<string | null>(null);
  const [showDeleteSubscriptionDialog, setShowDeleteSubscriptionDialog] = useState<string | null>(
    null
  );

  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isSubscribing: isPushSubscribing,
    permission: pushPermission,
    error: pushError,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    refresh: refreshPushStatus,
  } = usePushNotifications();

  const loadData = async () => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);

      // Fetch user profile to get image URL
      const userProfile = await getProfile();
      setProfile(userProfile);

      // Fetch passkeys
      const passkeysResult = await authClient.passkey.listUserPasskeys();
      if (passkeysResult.data) {
        setPasskeys(passkeysResult.data as unknown as Passkey[]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('account.loadFailed'));
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  const loadPushSubscriptions = async () => {
    if (!isPushSubscribed) {
      setPushSubscriptions([]);
      return;
    }

    try {
      setIsLoadingSubscriptions(true);
      const subscriptions = await getPushSubscriptions();
      setPushSubscriptions(subscriptions);
    } catch (err) {
      console.error('Failed to load push subscriptions:', err);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    void loadPushSubscriptions();
  }, [isPushSubscribed]);

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

      // Only reload passkeys, not the entire session
      try {
        const passkeysResult = await authClient.passkey.listUserPasskeys();
        if (passkeysResult.data) {
          setPasskeys(passkeysResult.data as unknown as Passkey[]);
        }
      } catch {
        // If passkey list fails, fall back to full reload
        await loadData();
      }
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

    // Better Auth doesn't expose delete/update as client methods, use fetch with Better Auth's fetchOptions pattern
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
      // Better Auth returns 200 with null result on success, or error object on failure
      // Check for explicit errors first
      if (!response.ok) {
        const errorMessage = result?.error?.message || t('account.passkeys.deleteFailed');
        toast.error(errorMessage);
        return;
      }

      // If response is OK but has an error object, treat as failure
      if (result && typeof result === 'object' && result.error) {
        const errorMessage = result.error.message || t('account.passkeys.deleteFailed');
        toast.error(errorMessage);
        return;
      }

      // If response is OK and result is null or success is true, treat as success
      // Better Auth returns null on successful deletion
      if (response.ok && (result === null || result.success !== false)) {
        toast.success(t('account.passkeys.deleteSuccess'));
      } else {
        // Fallback: if we get here, something unexpected happened
        toast.error(t('account.passkeys.deleteFailed'));
        return;
      }

      // Reload passkeys list
      const passkeysResult = await authClient.passkey.listUserPasskeys();
      if (passkeysResult.data) {
        setPasskeys(passkeysResult.data as unknown as Passkey[]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('account.passkeys.deleteFailed'));
    }
  };

  const handleConfirmDeleteSubscription = async () => {
    const subscriptionId = showDeleteSubscriptionDialog;
    if (!subscriptionId) return;

    setShowDeleteSubscriptionDialog(null);
    try {
      await deletePushSubscription(subscriptionId);
      toast.success(t('account.pushNotifications.devices.deleteSuccess'));
      await loadPushSubscriptions();
      // If this was the current device, refresh subscription status
      await refreshPushStatus();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('account.pushNotifications.devices.deleteFailed')
      );
    }
  };

  const handleUpdatePasskeyName = async (passkeyId: string, newName: string) => {
    // Better Auth doesn't expose delete/update as client methods, use fetch with Better Auth's fetchOptions pattern
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

      // Update the passkey in the local state
      setPasskeys((prev) => prev.map((p) => (p.id === passkeyId ? { ...p, name: newName } : p)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('account.passkeys.updateFailed'));
    }
  };

  const parseUserAgent = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) {
      return userAgent.includes('Mobile') ? 'Chrome Mobile' : 'Chrome';
    }
    if (userAgent.includes('Firefox')) {
      return userAgent.includes('Mobile') ? 'Firefox Mobile' : 'Firefox';
    }
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return userAgent.includes('Mobile') ? 'Safari Mobile' : 'Safari';
    }
    if (userAgent.includes('Edge')) {
      return 'Edge';
    }
    if (userAgent.includes('Opera')) {
      return 'Opera';
    }
    return t('account.pushNotifications.devices.unknownDevice');
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl text-white">{t('account.title')}</h1>
        <p className="mt-2 text-slate-400 text-sm">{t('account.subtitle')}</p>
      </div>

      {/* Profile Image */}
      <div className="rounded-2xl border border-white/10 bg-linear-to-br from-slate-950/70 via-slate-900/60 to-slate-900/40 p-5 shadow-xl">
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
            onImageUpdate={async (image) => {
              await loadData(); // Reload to get updated profile
            }}
            size="xl"
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
                  await loadData(); // Reload to get updated session
                  // Trigger a custom event to notify other components
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
                try {
                  await updateUserPhone(newPhone);
                  toast.success(t('account.phoneUpdate.success'));
                  await loadData();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : t('account.phoneUpdate.failed'));
                }
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('account.passkeys.title')}</CardTitle>
              <CardDescription>{t('account.passkeys.description')}</CardDescription>
            </div>
            <Button
              onClick={handleRegisterPasskey}
              disabled={isRegistering}
              variant="primary"
              size="sm"
              loading={isRegistering}
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
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50">
                        <DeviceIcon className="h-5 w-5 text-slate-300" />
                      </div>
                      <div className="flex-1">
                        <PasskeyNameEditor
                          currentName={passkey.name}
                          onUpdate={async (newName) => {
                            await handleUpdatePasskeyName(passkey.id, newName);
                          }}
                          placeholder={passkey.deviceType || t('account.passkeys.unnamed')}
                        />
                        <div className="mt-1 text-slate-400 text-sm">
                          {passkey.deviceType} • {t('account.passkeys.registered')}{' '}
                          {new Date(passkey.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleDeletePasskey(passkey.id)}
                        variant="danger"
                        size="sm"
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('account.pushNotifications.title')}</CardTitle>
              <CardDescription>{t('account.pushNotifications.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isPushSupported ? (
              <Alert tone="warning">{t('account.pushNotifications.notSupported')}</Alert>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50">
                        <Bell className="h-5 w-5 text-slate-300" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {t('account.pushNotifications.status')}
                        </div>
                        <div className="mt-1 text-slate-400 text-sm">
                          {isPushSubscribed
                            ? t('account.pushNotifications.subscribed')
                            : t('account.pushNotifications.notSubscribed')}
                          {pushPermission && (
                            <span className="ml-2">
                              • {t(`account.pushNotifications.permission.${pushPermission}`)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPushSubscribed ? (
                        <Button
                          onClick={async () => {
                            try {
                              await pushUnsubscribe();
                              toast.success(t('account.pushNotifications.unsubscribeSuccess'));
                              await refreshPushStatus();
                              await loadPushSubscriptions();
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : t('account.pushNotifications.unsubscribeFailed')
                              );
                            }
                          }}
                          disabled={isPushSubscribing}
                          variant="danger"
                          size="sm"
                          loading={isPushSubscribing}
                        >
                          {t('account.pushNotifications.disable')}
                        </Button>
                      ) : (
                        <Button
                          onClick={async () => {
                            try {
                              await pushSubscribe();
                              toast.success(t('account.pushNotifications.subscribeSuccess'));
                              await refreshPushStatus();
                              await loadPushSubscriptions();
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : t('account.pushNotifications.subscribeFailed')
                              );
                            }
                          }}
                          disabled={isPushSubscribing}
                          variant="primary"
                          size="sm"
                          loading={isPushSubscribing}
                        >
                          {t('account.pushNotifications.enable')}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isPushSubscribed && (
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/40 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50">
                          <RefreshCw className="h-5 w-5 text-slate-300" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {t('account.pushNotifications.test.title')}
                          </div>
                          <div className="mt-1 text-slate-400 text-sm">
                            {t('account.pushNotifications.test.description')}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            setIsTestingNotification(true);
                            const result = await sendTestNotification();
                            if (result.success) {
                              toast.success(t('account.pushNotifications.test.success'));
                            } else {
                              toast.error(t('account.pushNotifications.test.failed'));
                            }
                          } catch (err) {
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : t('account.pushNotifications.test.failed')
                            );
                          } finally {
                            setIsTestingNotification(false);
                          }
                        }}
                        disabled={isTestingNotification}
                        variant="outline"
                        size="sm"
                        loading={isTestingNotification}
                      >
                        {t('account.pushNotifications.test.button')}
                      </Button>
                    </div>
                  )}

                  {pushError && (
                    <Alert tone="error">
                      {pushError}
                      {pushPermission === 'denied' && (
                        <div className="mt-2 text-sm">
                          {t('account.pushNotifications.permissionDeniedHelp')}
                        </div>
                      )}
                    </Alert>
                  )}

                  {/* Registered Devices */}
                  {isPushSubscribed && (
                    <div className="mt-4 space-y-3 border-white/10 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white">
                            {t('account.pushNotifications.devices.title')}
                          </h3>
                          <p className="mt-1 text-slate-400 text-sm">
                            {t('account.pushNotifications.devices.description')}
                          </p>
                        </div>
                        <Button
                          onClick={loadPushSubscriptions}
                          disabled={isLoadingSubscriptions}
                          variant="ghost"
                          size="sm"
                          loading={isLoadingSubscriptions}
                        >
                          <RefreshCw size={16} />
                        </Button>
                      </div>

                      {isLoadingSubscriptions ? (
                        <div className="py-4 text-center text-slate-400">
                          {t('account.loading')}
                        </div>
                      ) : pushSubscriptions.length === 0 ? (
                        <EmptyState
                          icon={Bell}
                          title={t('account.pushNotifications.devices.emptyState.title')}
                          description={t(
                            'account.pushNotifications.devices.emptyState.description'
                          )}
                        />
                      ) : (
                        <div className="space-y-2">
                          {pushSubscriptions.map((subscription) => {
                            const deviceName = subscription.userAgent
                              ? parseUserAgent(subscription.userAgent)
                              : t('account.pushNotifications.devices.unknownDevice');
                            return (
                              <div
                                key={subscription.id}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/40 p-4"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50">
                                    <Laptop className="h-5 w-5 text-slate-300" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-white">{deviceName}</div>
                                    <div className="mt-1 text-slate-400 text-sm">
                                      {t('account.pushNotifications.devices.registered')}{' '}
                                      {new Date(subscription.createdAt).toLocaleDateString()}
                                    </div>
                                    {subscription.userAgent && (
                                      <div className="mt-1 max-w-md truncate text-slate-500 text-xs">
                                        {subscription.userAgent}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => {
                                      setShowDeleteSubscriptionDialog(subscription.id);
                                    }}
                                    variant="danger"
                                    size="sm"
                                  >
                                    {t('account.pushNotifications.devices.delete')}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Alert
                  tone="info"
                  title={t('account.pushNotifications.about.title')}
                  className="mt-4"
                >
                  {t('account.pushNotifications.about.description')}
                </Alert>
              </>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Delete Subscription Confirmation Dialog */}
      <AlertDialog
        open={showDeleteSubscriptionDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteSubscriptionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('account.pushNotifications.devices.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('account.pushNotifications.devices.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeleteSubscription}>
              {t('account.pushNotifications.devices.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
