import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '@/components/ui';
import { UserApi } from '../lib/api';

type LoaderData = {
  profile: Awaited<ReturnType<typeof UserApi.getProfile>>;
  history: Awaited<ReturnType<typeof UserApi.getOrderHistory>>;
};

export async function profileLoader(_: LoaderFunctionArgs) {
  const [profile, history] = await Promise.all([UserApi.getProfile(), UserApi.getOrderHistory()]);

  return Response.json({ profile, history });
}

export function ProfileRoute() {
  const { profile, history } = useLoaderData() as LoaderData;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-60 w-60 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge tone="brand" pill className="w-fit">
              Operator profile
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              {profile.username}
            </h1>
            <p className="text-sm text-slate-200">
              Your command center identity for coordinating every French tacos drop.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
            <ProfileStat label="User ID" value={profile.id} />
            <ProfileStat label="Orders logged" value={history.length.toString()} tone="brand" />
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="p-6">
          <CardHeader className="gap-2">
            <CardTitle className="text-white">Account details</CardTitle>
            <CardDescription>
              Everything we know about your tacos persona inside Tacobot.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ProfileField label="Username" value={profile.username} />
            <ProfileField label="User ID" value={profile.id} />
            <ProfileField label="Slack ID" value={profile.slackId ?? '—'} />
            <ProfileField
              label="Created"
              value={profile.createdAt ? formatDateTime(profile.createdAt) : '—'}
            />
            <ProfileField
              label="Updated"
              value={profile.updatedAt ? formatDateTime(profile.updatedAt) : '—'}
            />
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-white">Order history</CardTitle>
              <Badge tone="neutral" pill>
                {history.length} entries
              </Badge>
            </div>
            <CardDescription>
              Recent submissions and dispatches you have coordinated with the crew.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-10 text-center text-sm text-slate-300">
                No orders yet. Rally the squad to place your first sizzling run.
              </div>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{entry.orderType}</p>
                      <p className="text-xs text-slate-400">
                        Requested for {entry.requestedFor ?? '—'}
                      </p>
                    </div>
                    <StatusBadge status={entry.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                    <span className="uppercase tracking-[0.3em] text-slate-500">
                      Order {entry.orderId}
                    </span>
                    <span>Created {formatDateTime(entry.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type ProfileStatTone = 'neutral' | 'brand';

function ProfileStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: ProfileStatTone;
}) {
  const toneClasses: Record<ProfileStatTone, string> = {
    neutral: 'border-white/12 bg-slate-900/70 text-slate-100',
    brand: 'border-brand-400/40 bg-brand-500/15 text-brand-50',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-300">{label}</p>
      <p className="mt-2 text-sm font-semibold tracking-tight break-all">{value}</p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm text-white">{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
