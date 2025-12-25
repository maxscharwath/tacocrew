import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tacocrew/ui-kit';
import { Lock, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DeliveryProfilesManager } from '@/components/profile/DeliveryProfilesManager';
import { BackButton, PageHero } from '@/components/shared';
import { useDeliveryProfiles } from '@/lib/api/user';
import { routes } from '@/lib/routes';
import { createSavedCountText } from '@/lib/utils/organization-utils';

export function profileDeliveryLoader() {
  return Response.json({});
}

export function ProfileDeliveryRoute() {
  const { t } = useTranslation();
  const profilesQuery = useDeliveryProfiles();
  const profiles = profilesQuery.data || [];
  const savedCountText = createSavedCountText(
    profiles.length,
    t('profile.delivery.stats.empty'),
    (count) => t('profile.delivery.stats.count', { count })
  );

  return (
    <div className="space-y-8">
      <BackButton
        to={routes.root.profile()}
        label={t('profile.history.backToProfile', 'Back to profile')}
      />

      <PageHero
        variant="amber"
        icon={Lock}
        title={t('profile.delivery.title')}
        subtitle={t('profile.delivery.subtitle')}
      >
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">
              {t('profile.delivery.stats.label')}
            </p>
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
              <CardTitle className="text-white">{t('profile.delivery.formCard.title')}</CardTitle>
              <CardDescription>{t('profile.delivery.formCard.description')}</CardDescription>
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
