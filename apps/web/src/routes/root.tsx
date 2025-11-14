import { Activity, ClipboardCheck, LogOut, Package, Settings, Terminal, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Form,
  isRouteErrorResponse,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useRouteError,
} from 'react-router';
import { Alert, Avatar, Button, Card } from '@/components/ui';
import { LanguageSwitcher } from '../components/language-switcher';
import { useDeveloperMode } from '../hooks/useDeveloperMode';
import { authClient } from '../lib/auth-client';
import { routes } from '../lib/routes';
import type { RootLoaderData } from './root.loader';

export function RootLayout() {
  const { t } = useTranslation();
  const { profile } = useLoaderData<RootLoaderData>();
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

    globalThis.window.addEventListener('userNameUpdated', handleNameUpdate);
    globalThis.window.addEventListener('focus', loadSession);

    return () => {
      globalThis.window.removeEventListener('userNameUpdated', handleNameUpdate);
      globalThis.window.removeEventListener('focus', loadSession);
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
    { href: '/profile', labelKey: 'navigation.profile', icon: Users },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-24 absolute right-1/2 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-10 pb-20">
        <Card className="overflow-hidden border-white/10 bg-slate-900/60 shadow-[0_40px_120px_rgba(8,47,73,0.25)] backdrop-blur">
          {/* Top Section: Brand + User Actions */}
          <div className="flex items-center justify-between gap-4 border-white/10 border-b px-6 py-4">
            {/* Brand Section */}
            <div className="flex min-w-0 items-center gap-3">
              <Avatar color="brandHero" size="md" variant="elevated">
                <span className="text-base">🌮</span>
              </Avatar>
              <h1 className="truncate font-semibold text-white text-xl tracking-tight">
                {t('root.tacobot')}
              </h1>
            </div>

            {/* User Actions Section */}
            <div className="flex shrink-0 items-center gap-2.5">
              <Button
                type="button"
                variant={isDeveloperMode ? 'primary' : 'ghost'}
                size="sm"
                onClick={toggleDeveloperMode}
                className="h-9 w-9 p-0"
                title={isDeveloperMode ? 'Developer Mode: ON' : 'Developer Mode: OFF'}
              >
                <Terminal size={16} />
              </Button>
              <LanguageSwitcher />
              <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 px-2.5 py-1.5 shadow-black/20 shadow-lg backdrop-blur-sm">
                <Link to={routes.root.profile()} className="cursor-pointer">
                  <Avatar color="brandHero" size="sm">
                    {userInitials}
                  </Avatar>
                </Link>
                <Link
                  to={routes.root.profile()}
                  className="max-w-[100px] truncate font-semibold text-white text-xs hover:text-brand-100 sm:max-w-[150px]"
                  title={userName}
                >
                  {userName}
                </Link>
                <Link to={routes.root.profileAccount()} className="shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title={t('navigation.profile')}
                  >
                    <Settings size={14} />
                  </Button>
                </Link>
                <Form method="post" className="shrink-0">
                  <input type="hidden" name="_intent" value="logout" />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title={t('common.signOut')}
                  >
                    <LogOut size={14} />
                  </Button>
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
        </Card>

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

function ErrorState({ title, message }: { readonly title: string; readonly message: string }) {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-24 absolute right-1/2 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <Alert tone="error" title={title} className="max-w-md">
          {message}
        </Alert>
      </div>
    </div>
  );
}
