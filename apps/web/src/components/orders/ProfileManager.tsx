import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
} from '@tacocrew/ui-kit';
import { Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DeliveryProfile } from '@/lib/api/types';
import { formatPhoneNumber } from '@/utils/phone-formatter';

type ProfileManagerProps = {
  readonly deliveryProfiles: DeliveryProfile[];
  readonly selectedProfileId: string;
  readonly profileLabel: string;
  readonly setProfileLabel: (value: string) => void;
  readonly profileMessage: { type: 'success' | 'error'; text: string } | null;
  readonly profileLoading: boolean;
  readonly onProfileSelect: (profileId: string) => void;
  readonly onClearProfileSelection: () => void;
  readonly onSaveProfile: () => void;
  readonly onUpdateProfile: () => void;
  readonly onDeleteProfile: () => void;
  readonly disabled?: boolean;
};

export function ProfileManager({
  deliveryProfiles,
  selectedProfileId,
  profileLabel,
  setProfileLabel,
  profileMessage,
  profileLoading,
  onProfileSelect,
  onClearProfileSelection,
  onSaveProfile,
  onUpdateProfile,
  onDeleteProfile,
  disabled = false,
}: ProfileManagerProps) {
  const { t } = useTranslation();

  return (
    <Card className="flex h-full flex-col border-white/10 bg-slate-800/30">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-white">{t('orders.submit.saved.title')}</CardTitle>
            <CardDescription>{t('orders.submit.saved.description')}</CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearProfileSelection}
            disabled={profileLoading || disabled}
          >
            {t('orders.submit.saved.actions.clear')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:max-h-[360px] lg:overflow-y-auto lg:pr-1">
          {deliveryProfiles.slice(0, 4).map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition duration-200 ${
                profile.id === selectedProfileId
                  ? 'border-brand-400 bg-brand-500/10 text-white shadow-[0_10px_30px_rgba(99,102,241,0.35)]'
                  : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-brand-400/40 hover:text-white'
              }`}
              onClick={() => onProfileSelect(profile.id)}
              disabled={disabled || profileLoading}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">
                  {profile.label ?? t('orders.submit.saved.unnamedProfile')}
                </p>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-slate-300 uppercase tracking-wide">
                  {t(`orders.submit.form.deliveryTypes.${profile.deliveryType}`)}
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                {profile.contactName} • {formatPhoneNumber(profile.phone)}
              </p>
              <p className="text-slate-500 text-xs">
                {profile.address.road}
                {profile.address.houseNumber ? ` ${profile.address.houseNumber}` : ''},&nbsp;
                {profile.address.postcode} {profile.address.city}
                {profile.address.state ? ` (${profile.address.state})` : ''}
              </p>
            </button>
          ))}
          {deliveryProfiles.length === 0 && (
            <div className="col-span-full rounded-xl border border-white/10 border-dashed bg-slate-900/30 p-4 text-center text-slate-500 text-sm">
              {t('orders.submit.saved.emptyState')}
            </div>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="profileLabelMain">{t('orders.submit.saved.labelField')}</Label>
            <InputGroup>
              <InputGroupAddon>
                <Tag className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="profileLabelMain"
                placeholder={t('orders.submit.saved.inputPlaceholder')}
                value={profileLabel}
                onChange={(event) => setProfileLabel(event.target.value)}
                disabled={profileLoading || disabled}
              />
            </InputGroup>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSaveProfile}
              disabled={profileLoading || disabled}
            >
              {t('orders.submit.saved.actions.save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onUpdateProfile}
              disabled={profileLoading || !selectedProfileId || disabled}
            >
              {t('orders.submit.saved.actions.update')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onDeleteProfile}
              disabled={profileLoading || !selectedProfileId || disabled}
              className="text-rose-300 hover:text-rose-200"
            >
              {t('orders.submit.saved.actions.delete')}
            </Button>
          </div>
          {profileMessage ? (
            <Alert tone={profileMessage.type === 'success' ? 'success' : 'error'}>
              {profileMessage.text}
            </Alert>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
