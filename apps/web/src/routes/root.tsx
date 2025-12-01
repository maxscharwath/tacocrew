import {
  Activity,
  ClipboardCheck,
  Info,
  LogOut,
  Package,
  Settings,
  Terminal,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Form,
  isRouteErrorResponse,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useRevalidator,
  useRouteError,
} from 'react-router';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Alert, Avatar, Button, Card } from '@/components/ui';
import { useDeveloperMode } from '@/hooks/useDeveloperMode';
import { resolveImageUrl } from '@/lib/api';
import { routes } from '@/lib/routes';
import type { RootLoaderData } from './root.loader';

export function RootLayout() {
  const { t, i18n } = useTranslation();
  const { profile } = useLoaderData<RootLoaderData>();
  const { isEnabled: isDeveloperMode, toggle: toggleDeveloperMode } = useDeveloperMode();
  const revalidator = useRevalidator();

  // Sync user's language preference from profile to i18n (only on initial load)
  useEffect(() => {
    if (profile?.language && profile.language !== i18n.language) {
      i18n.changeLanguage(profile.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.language]);

  const userName = profile?.name || profile?.username || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

  // Revalidate route when profile data updates
  useEffect(() => {
    const handleUpdate = () => {
      revalidator.revalidate();
    };

    globalThis.addEventListener('userNameUpdated', handleUpdate);
    globalThis.addEventListener('userImageUpdated', handleUpdate);

    return () => {
      globalThis.removeEventListener('userNameUpdated', handleUpdate);
      globalThis.removeEventListener('userImageUpdated', handleUpdate);
    };
  }, [revalidator]);

  // Service worker is auto-registered by vite-plugin-pwa
  type NavItem = {
    href: string;
    labelKey: string;
    icon: ComponentType<{ size?: number; className?: string }>;
  };
  const navItems: NavItem[] = [
    { href: routes.root.dashboard(), labelKey: 'navigation.dashboard', icon: Activity },
    { href: routes.root.orders(), labelKey: 'navigation.orders', icon: ClipboardCheck },
    { href: routes.root.stock(), labelKey: 'navigation.stock', icon: Package },
    { href: routes.root.profile(), labelKey: 'navigation.profile', icon: Users },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-24 absolute right-1/2 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 pt-4 pb-20 sm:px-6 sm:pt-10">
        <Card className="overflow-hidden border-white/10 bg-slate-900/60 shadow-[0_40px_120px_rgba(8,47,73,0.25)] backdrop-blur">
          {/* Top Section: Brand + User Actions */}
          <div className="flex items-center justify-between gap-4 border-white/10 border-b px-4 py-4 sm:px-6 sm:py-4">
            {/* Brand Section */}
            <Link
              to={routes.root.dashboard()}
              className="group -mx-2 -my-1.5 flex min-w-0 items-center gap-3 rounded-lg px-2 py-1.5 transition-all hover:bg-brand-500/10 hover:text-brand-100 active:bg-brand-500/15"
            >
              <Avatar color="brandHero" size="md" variant="elevated" className="shrink-0">
                <span className="text-base">🌮</span>
              </Avatar>
              <h1 className="hidden min-w-0 truncate font-semibold text-white text-xl tracking-tight sm:block">
                {t('root.tacobot')}
              </h1>
            </Link>

            {/* User Actions Section */}
            <div className="flex shrink-0 items-center gap-3">
              <NotificationBell />
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
              <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 px-3 py-1.5 shadow-black/20 shadow-lg backdrop-blur-sm">
                <Link to={routes.root.profile()} className="cursor-pointer">
                  <Avatar
                    color="brandHero"
                    size="sm"
                    src={resolveImageUrl(profile?.image, { size: 32 }) || undefined}
                  >
                    {userInitials}
                  </Avatar>
                </Link>
                <Link
                  to={routes.root.profile()}
                  className="max-w-[120px] truncate font-semibold text-white text-xs hover:text-brand-100 sm:max-w-[150px]"
                  title={userName}
                >
                  {userName}
                </Link>
                <div className="flex items-center gap-0.5 border-white/10 border-l pl-2">
                  <Link to={routes.root.about()} className="shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title={t('navigation.about')}
                    >
                      <Info size={14} />
                    </Button>
                  </Link>
                  <Link to={routes.root.profileAccount()} className="shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title={t('navigation.settings')}
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
          </div>

          {/* Navigation Section */}
          <nav className="flex gap-2 overflow-x-auto px-4 py-4 sm:flex-wrap sm:gap-2 sm:px-6 sm:py-4">
            {navItems.map(({ href, labelKey, icon: Icon }) => (
              <NavLink
                key={href}
                to={href}
                end={href === routes.root()}
                className={({ isActive }) =>
                  [
                    'group flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-medium text-sm transition',
                    isActive
                      ? 'border-brand-400/70 bg-brand-500/20 text-brand-100 shadow-glow-brand'
                      : 'border-white/10 bg-slate-800/60 text-slate-300 hover:border-brand-400/40 hover:text-brand-100',
                  ].join(' ')
                }
              >
                <Icon size={16} className="shrink-0 text-current" />
                <span className="whitespace-nowrap">{t(labelKey)}</span>
              </NavLink>
            ))}
          </nav>
        </Card>

        <main className="mt-4 flex-1 sm:mt-10">
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
