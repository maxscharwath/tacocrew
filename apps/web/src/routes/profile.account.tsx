import { Edit01 } from '@untitledui/icons/Edit01';
import { InfoCircle } from '@untitledui/icons/InfoCircle';
import { Key01 } from '@untitledui/icons/Key01';
import { Laptop01 } from '@untitledui/icons/Laptop01';
import { Lock01 } from '@untitledui/icons/Lock01';
import { Phone01 } from '@untitledui/icons/Phone01';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LoaderFunctionArgs, redirect } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { authClient } from '@/lib/auth-client';
import { ENV } from '@/lib/env';

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
      <div>
        <label className="mb-1 block font-medium text-slate-200 text-sm">
          {t('account.profile.name')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            autoFocus
            disabled={isSaving}
            className="flex-1 rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2 text-white placeholder-slate-500 shadow-inner transition focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-4 py-2 font-semibold text-brand-400 text-sm transition hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? t('account.saving') : t('account.save')}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="rounded-lg border border-white/10 bg-slate-700/40 px-4 py-2 font-semibold text-sm text-white transition hover:bg-slate-600/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('account.cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block font-medium text-slate-200 text-sm">
        {t('account.profile.name')}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-white">{currentName}</div>
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg border border-white/10 bg-slate-700/40 px-3 py-1.5 font-semibold text-sm text-white transition hover:bg-slate-600/40"
        >
          {t('account.edit')}
        </button>
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
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              handleCancel();
            }
          }}
          autoFocus
          disabled={isSaving}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-white/10 bg-slate-700/40 px-2 py-1 text-sm text-white placeholder-slate-500 shadow-inner transition focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-2 py-1 font-semibold text-brand-400 text-xs transition hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? t('account.saving') : t('account.save')}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="rounded-lg border border-white/10 bg-slate-700/40 px-2 py-1 font-semibold text-white text-xs transition hover:bg-slate-600/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('account.cancel')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-white">{currentName || placeholder}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-700/40 transition hover:bg-slate-600/40"
        title={t('account.passkeys.rename')}
        aria-label={t('account.passkeys.rename')}
      >
        <Edit01 className="h-3.5 w-3.5 text-slate-300" />
      </button>
    </div>
  );
}

type Passkey = {
  id: string;
  name?: string;
  deviceType: string;
  createdAt: string;
};

type UserSession = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
  };
  session: {
    id: string;
    expiresAt: string;
  };
};

export async function accountLoader(_: LoaderFunctionArgs) {
  const session = await authClient.getSession();
  if (!session?.data) {
    throw redirect('/login');
  }
  return null;
}

export function AccountRoute() {
  const { t } = useTranslation();
  const [session, setSession] = useState<UserSession | null>(null);
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
      const sessionData = await authClient.getSession();

      if (sessionData?.data) {
        setSession(sessionData.data as unknown as UserSession);

        // Fetch passkeys
        const passkeysResult = await authClient.passkey.listUserPasskeys();
        if (passkeysResult.data) {
          setPasskeys(passkeysResult.data as unknown as Passkey[]);
        }
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
    loadData();
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
      return Phone01;
    }
    if (type.includes('laptop') || type.includes('computer') || type.includes('desktop')) {
      return Laptop01;
    }
    // For other devices, use Lock01 (security key icon)
    return Lock01;
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

      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-rose-100 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-green-100 text-sm">
          {success}
        </div>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader className="px-6 pt-6">
          <CardTitle>{t('account.profile.title')}</CardTitle>
          <CardDescription>{t('account.profile.description')}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
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
            <div>
              <label className="mb-1 block font-medium text-slate-200 text-sm">
                {t('account.profile.email')}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-white">{session.user.email}</span>
                {session.user.emailVerified ? (
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 font-semibold text-green-400 text-xs">
                    {t('account.profile.verified')}
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 font-semibold text-xs text-yellow-400">
                    {t('account.profile.unverified')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passkeys */}
      <Card>
        <CardHeader className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('account.passkeys.title')}</CardTitle>
              <CardDescription>{t('account.passkeys.description')}</CardDescription>
            </div>
            <button
              onClick={handleRegisterPasskey}
              disabled={isRegistering}
              className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-4 py-2 font-semibold text-brand-400 text-sm transition hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRegistering ? t('account.passkeys.registering') : t('account.passkeys.addButton')}
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-3">
            {passkeys.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-slate-800/40 p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700/50">
                    <Key01 className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
                <div className="mb-1 font-semibold text-white">
                  {t('account.passkeys.emptyState.title')}
                </div>
                <div className="text-slate-400 text-sm">
                  {t('account.passkeys.emptyState.description')}
                </div>
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
                      <button
                        onClick={() => handleDeletePasskey(passkey.id)}
                        className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 font-semibold text-rose-400 text-sm transition hover:bg-rose-500/20"
                      >
                        {t('account.passkeys.delete')}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-400/20 bg-blue-500/10">
        <CardContent className="px-6 py-6">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/20">
              <InfoCircle className="h-5 w-5 text-blue-300" />
            </div>
            <div className="flex-1">
              <div className="mb-1 font-semibold text-blue-100">
                {t('account.passkeys.about.title')}
              </div>
              <div className="text-blue-200 text-sm">{t('account.passkeys.about.description')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
