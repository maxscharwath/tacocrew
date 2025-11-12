import { Activity } from '@untitledui/icons/Activity';
import { ClipboardCheck } from '@untitledui/icons/ClipboardCheck';
import { Package } from '@untitledui/icons/Package';
import { Terminal } from '@untitledui/icons/Terminal';
import { Users03 } from '@untitledui/icons/Users03';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Form,
  isRouteErrorResponse,
  NavLink,
  Outlet,
  useLoaderData,
  useRouteError,
} from 'react-router';
import { LanguageSwitcher } from '../components/language-switcher';
import { useDeveloperMode } from '../hooks/useDeveloperMode';
import { authClient } from '../lib/auth-client';
import type { RootLoaderData } from './root.loader';

export function RootLayout() {
  const { t } = useTranslation();
  const { profile } = useLoaderData() as RootLoaderData;
  const { isEnabled: isDeveloperMode, toggle: toggleDeveloperMode } = useDeveloperMode();
  const [userName, setUserName] = useState<string>(profile?.username || 'User');
  const [userInitials, setUserInitials] = useState<string>(
    (profile?.username || 'User').slice(0, 2).toUpperCase()
  );

  // Get Better Auth session to display the updated name
  useEffect(() => {
    const loadSession = () => {
      authClient.getSession().then((session) => {
        if (session?.data?.user) {
          const name = session.data.user.name || session.data.user.email.split('@')[0];
          setUserName(name);
          setUserInitials(name.slice(0, 2).toUpperCase());
        }
      });
    };

    loadSession();

    // Listen for name update events
    const handleNameUpdate = () => {
      loadSession();
    };

    window.addEventListener('userNameUpdated', handleNameUpdate);
    window.addEventListener('focus', loadSession);

    return () => {
      window.removeEventListener('userNameUpdated', handleNameUpdate);
      window.removeEventListener('focus', loadSession);
    };
  }, []);
  type NavItem = {
    href: string;
    labelKey: string;
    icon: ComponentType<{ size?: number; className?: string }>;
  };
  const navItems: NavItem[] = [
    { href: '/', labelKey: 'navigation.dashboard', icon: Activity },
    { href: '/orders', labelKey: 'navigation.orders', icon: ClipboardCheck },
    { href: '/stock', labelKey: 'navigation.stock', icon: Package },
    { href: '/profile', labelKey: 'navigation.profile', icon: Users03 },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-24 absolute right-1/2 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-10 pb-20">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-[0_40px_120px_rgba(8,47,73,0.25)] backdrop-blur">
          {/* Top Section: Brand + User Actions */}
          <div className="flex items-center justify-between gap-4 border-white/10 border-b px-6 py-4">
            {/* Brand Section */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-400 via-brand-500 to-sky-500 text-base shadow-glow-brand">
                🌮
              </div>
              <h1 className="truncate font-semibold text-white text-xl tracking-tight">
                {t('root.tacobot')}
              </h1>
            </div>

            {/* User Actions Section */}
            <div className="flex shrink-0 items-center gap-2.5">
              <button
                onClick={toggleDeveloperMode}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                  isDeveloperMode
                    ? 'border-brand-400/70 bg-brand-500/20 text-brand-100 shadow-glow-brand'
                    : 'border-white/10 bg-slate-800/60 text-slate-400 hover:border-brand-400/40 hover:text-brand-100'
                }`}
                title={isDeveloperMode ? 'Developer Mode: ON' : 'Developer Mode: OFF'}
              >
                <Terminal size={16} />
              </button>
              <LanguageSwitcher />
              <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 px-2.5 py-1.5 shadow-black/20 shadow-lg backdrop-blur-sm">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-linear-to-br from-brand-400 via-brand-500 to-sky-500 font-bold text-[10px] text-white shadow-brand-500/30 shadow-md">
                  {userInitials}
                </div>
                <span
                  className="max-w-[100px] truncate font-semibold text-white text-xs sm:max-w-[150px]"
                  title={userName}
                >
                  {userName}
                </span>
                <Form method="post" className="shrink-0">
                  <input type="hidden" name="_intent" value="logout" />
                  <button
                    type="submit"
                    className="rounded-lg border border-white/5 bg-slate-800/80 px-2.5 py-1 font-semibold text-[11px] text-slate-200 shadow-sm transition-colors hover:border-white/10 hover:bg-slate-700/90"
                  >
                    {t('common.signOut')}
                  </button>
                </Form>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="flex flex-wrap gap-2 px-6 py-4">
            {navItems.map(({ href, labelKey, icon: Icon }) => (
              <NavLink
                key={href}
                to={href}
                end={href === '/'}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-medium text-sm transition',
                    isActive
                      ? 'border-brand-400/70 bg-brand-500/20 text-brand-100 shadow-glow-brand'
                      : 'border-white/10 bg-slate-800/60 text-slate-300 hover:border-brand-400/40 hover:text-brand-100',
                  ].join(' ')
                }
              >
                <Icon size={16} className="shrink-0 text-current" />
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mt-10 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function RootErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <ErrorState title={error.status.toString()} message={error.statusText} />;
  }

  if (error instanceof Error) {
    return <ErrorState title={t('root.errors.applicationError')} message={error.message} />;
  }

  return (
    <ErrorState title={t('root.errors.unknownError')} message={t('root.errors.somethingWrong')} />
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="error-state">
      <h1>{title}</h1>
      <p>{message}</p>
    </div>
  );
}
