import { Check, Edit, Key, Laptop, Lock, Mail, Phone, RefreshCw, User, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LoaderFunctionArgs, redirect } from 'react-router';
import {
  Alert,
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
} from '@/components/ui';
import { authClient, useSession } from '@/lib/auth-client';
import { ENV } from '@/lib/env';
import { routes } from '@/lib/routes';

function NameEditor({
  currentName,
  onUpdate,
}: Readonly<{
  currentName: string;
  onUpdate: (name: string) => Promise<void>;
}>) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await onUpdate(name.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(currentName);
    setIsEditing(false);
  };

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
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            variant="primary"
            size="sm"
            className="h-11 w-11 p-0"
            title={isSaving ? t('account.saving') : t('account.save')}
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isSaving}
            variant="outline"
            size="sm"
            className="h-11 w-11 p-0"
            title={t('account.cancel')}
          >
            <X size={16} />
          </Button>
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
        <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="gap-2">
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
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(currentName || '');
  }, [currentName]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(name.trim() || placeholder);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(currentName || '');
    setIsEditing(false);
  };

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
        <Button
          onClick={handleSave}
          disabled={isSaving}
          variant="primary"
          size="sm"
          className="h-9 w-9 p-0"
          title={isSaving ? t('account.saving') : t('account.save')}
        >
          {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
        </Button>
        <Button
          onClick={handleCancel}
          disabled={isSaving}
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
          title={t('account.cancel')}
        >
          <X size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-white">{currentName || placeholder}</span>
      <Button
        onClick={() => setIsEditing(true)}
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
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async () => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);

      // Fetch passkeys
      const passkeysResult = await authClient.passkey.listUserPasskeys();
      if (passkeysResult.data) {
        setPasskeys(passkeysResult.data as unknown as Passkey[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.loadFailed'));
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Don't depend on t to avoid recreating the function

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleRegisterPasskey = async () => {
    try {
      setIsRegistering(true);
      setError(null);
      setSuccess(null);

      const deviceName = `${t('account.passkeys.deviceNamePrefix')} ${new Date().toLocaleDateString()}`;

      // Use Better Auth's passkey.addPasskey() method which handles the entire flow
      const result = await authClient.passkey.addPasskey({
        name: deviceName,
      });

      if (result?.error) {
        setError(result.error.message || t('account.passkeys.registerFailed'));
        setIsRegistering(false);
        return;
      }

      setSuccess(t('account.passkeys.registerSuccess'));

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
      setError(err instanceof Error ? err.message : t('account.passkeys.registerFailed'));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!confirm(t('account.passkeys.deleteConfirm'))) {
      return;
    }

    setError(null);
    setSuccess(null);

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
        setError(errorMessage);
        return;
      }

      // If response is OK but has an error object, treat as failure
      if (result && typeof result === 'object' && result.error) {
        const errorMessage = result.error.message || t('account.passkeys.deleteFailed');
        setError(errorMessage);
        return;
      }

      // If response is OK and result is null or success is true, treat as success
      // Better Auth returns null on successful deletion
      if (response.ok && (result === null || result.success !== false)) {
        setSuccess(t('account.passkeys.deleteSuccess'));
      } else {
        // Fallback: if we get here, something unexpected happened
        setError(t('account.passkeys.deleteFailed'));
        return;
      }

      // Reload passkeys list
      const passkeysResult = await authClient.passkey.listUserPasskeys();
      if (passkeysResult.data) {
        setPasskeys(passkeysResult.data as unknown as Passkey[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.passkeys.deleteFailed'));
    }
  };

  const handleUpdatePasskeyName = async (passkeyId: string, newName: string) => {
    setError(null);
    setSuccess(null);

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
        setError(result.error?.message || t('account.passkeys.updateFailed'));
        return;
      }

      setSuccess(t('account.passkeys.updateSuccess'));

      // Update the passkey in the local state
      setPasskeys((prev) => prev.map((p) => (p.id === passkeyId ? { ...p, name: newName } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.passkeys.updateFailed'));
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl text-white">{t('account.title')}</h1>
        <p className="mt-2 text-slate-400 text-sm">{t('account.subtitle')}</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {success && <Alert tone="success">{success}</Alert>}

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
                  setError(null);
                  setSuccess(null);
                  const result = await authClient.updateUser({
                    name: newName,
                  });
                  if (result.error) {
                    setError(result.error.message || t('account.nameUpdate.failed'));
                    return;
                  }
                  setSuccess(t('account.nameUpdate.success'));
                  await loadData(); // Reload to get updated session
                  // Trigger a custom event to notify other components
                  globalThis.dispatchEvent(new CustomEvent('userNameUpdated'));
                } catch (err) {
                  setError(err instanceof Error ? err.message : t('account.nameUpdate.failed'));
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
    </div>
  );
}
