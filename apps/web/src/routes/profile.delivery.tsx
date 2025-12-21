import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tacocrew/ui-kit';
import { Lock, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router';
import { DeliveryProfilesManager } from '@/components/profile/DeliveryProfilesManager';
import { BackButton, PageHero } from '@/components/shared';
import { UserApi } from '@/lib/api';
import { routes } from '@/lib/routes';
import type { LoaderData } from '@/lib/types/loader-types';
import { createLoader } from '@/lib/utils/loader-factory';

export const profileDeliveryLoader = createLoader(
  async () => {
    const profiles = await UserApi.getDeliveryProfiles();
    return { profiles };
  }
);

export function ProfileDeliveryRoute() {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) =>
    t(`profile.delivery.${key}`, options);
  const { profiles } = useLoaderData<LoaderData<typeof profileDeliveryLoader>>();
  const savedCountText =
    profiles.length === 0 ? tt('stats.empty') : tt('stats.count', { count: profiles.length });

  return (
    <div className="space-y-8">
      <BackButton
        to={routes.root.profile()}
        label={t('profile.history.backToProfile', 'Back to profile')}
      />

      <PageHero variant="amber" icon={Lock} title={tt('title')} subtitle={tt('subtitle')}>
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">{tt('stats.label')}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-semibold text-2xl text-white">{profiles.length}</p>
              <Badge tone="neutral" pill>
                {savedCountText}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </PageHero>

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
