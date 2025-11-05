import { Activity } from '@untitledui/icons/Activity';
import { ClipboardCheck } from '@untitledui/icons/ClipboardCheck';
import { Package } from '@untitledui/icons/Package';
import { Users03 } from '@untitledui/icons/Users03';
import type { ComponentType } from 'react';
import {
  Form,
  isRouteErrorResponse,
  NavLink,
  Outlet,
  useLoaderData,
  useRouteError,
} from 'react-router';
import type { RootLoaderData } from './root.loader';

export function RootLayout() {
  const { profile } = useLoaderData() as RootLoaderData;
  type NavItem = {
    href: string;
    label: string;
    icon: ComponentType<{ size?: number; className?: string }>;
  };
  const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: Activity },
    { href: '/orders', label: 'Orders', icon: ClipboardCheck },
    { href: '/stock', label: 'Stock', icon: Package },
    { href: '/profile', label: 'Profile', icon: Users03 },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-1/2 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-20 pt-10">
        <header className="flex flex-col items-start gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_40px_120px_rgba(8,47,73,0.25)] backdrop-blur">
          <div className="flex w-full flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-sky-500 text-lg font-semibold shadow-glow-brand">
                🌮
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Tacobot Command</p>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  French Tacos Delivery Console
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Manage sizzling group orders, stock pulses, and rider timelines in one bright
                  workspace.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 shadow-inner">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-100">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Logged in as
                </span>
                <span className="text-sm font-medium text-white">{profile.username}</span>
              </div>
              <Form method="post" className="ml-3">
                <input type="hidden" name="_intent" value="logout" />
                <button
                  type="submit"
                  className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 shadow hover:bg-slate-700"
                >
                  Sign out
                </button>
              </Form>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <NavLink
                key={href}
                to={href}
                end={href === '/'}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'border-brand-400/70 bg-brand-500/20 text-brand-100 shadow-glow-brand'
                      : 'border-white/10 bg-slate-800/60 text-slate-300 hover:border-brand-400/40 hover:text-brand-100',
                  ].join(' ')
                }
              >
                <Icon size={18} className="text-current" />
                {label}
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
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <ErrorState title={error.status.toString()} message={error.statusText} />;
  }

  if (error instanceof Error) {
    return <ErrorState title="Application Error" message={error.message} />;
  }

  return <ErrorState title="Unknown Error" message="Something went wrong." />;
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="error-state">
      <h1>{title}</h1>
      <p>{message}</p>
    </div>
  );
}
