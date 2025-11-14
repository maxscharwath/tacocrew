import { ArrowLeft, Lock, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { DeliveryProfilesManager } from '@/components/profile/DeliveryProfilesManager';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { UserApi } from '@/lib/api';
import { routes } from '@/lib/routes';

interface LoaderData {
  profiles: Awaited<ReturnType<typeof UserApi.getDeliveryProfiles>>;
}

export async function profileDeliveryLoader(_: LoaderFunctionArgs) {
  const profiles = await UserApi.getDeliveryProfiles();
  return Response.json({ profiles });
}

export function ProfileDeliveryRoute() {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) =>
    t(`profile.delivery.${key}`, options);
  const { profiles } = useLoaderData<LoaderData>();
  const savedCountText =
    profiles.length === 0 ? tt('stats.empty') : tt('stats.count', { count: profiles.length });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to={routes.root.profile()}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft size={18} />
            {t('profile.history.backToProfile', 'Back to profile')}
          </Button>
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-amber-500/10 via-slate-900/80 to-slate-950/90 p-8">
        <div className="-top-24 pointer-events-none absolute right-0 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="-bottom-16 pointer-events-none absolute left-12 h-60 w-60 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br from-amber-400 via-amber-500 to-rose-500">
              <Lock size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-2xl text-white tracking-tight">{tt('title')}</h1>
              <p className="text-slate-300 text-sm">{tt('subtitle')}</p>
            </div>
          </div>

          <Card className="border-white/10 bg-slate-900/50">
            <CardContent className="p-4">
              <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">
                {tt('stats.label')}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="font-semibold text-2xl text-white">{profiles.length}</p>
                <Badge tone="neutral" pill>
                  {savedCountText}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-amber-400 via-amber-500 to-rose-500">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-white">{tt('formCard.title')}</CardTitle>
              <CardDescription>{tt('formCard.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DeliveryProfilesManager profiles={profiles} />
        </CardContent>
      </Card>
    </div>
  );
}
