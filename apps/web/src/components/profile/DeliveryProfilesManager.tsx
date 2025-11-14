import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeliveryTypeSelector } from '@/components/orders/DeliveryTypeSelector';
import { Alert, Button, Input, Label } from '@/components/ui';
import { SWISS_CANTONS, SWITZERLAND_COUNTRY } from '@/constants/location';
import { UserApi } from '@/lib/api';
import type { DeliveryProfile, DeliveryProfilePayload } from '@/lib/api/types';
import { getInitialDeliveryFormState, profileToForm } from '@/utils/delivery-profile-helpers';

interface DeliveryProfilesManagerProps {
  readonly profiles: DeliveryProfile[];
}

export function DeliveryProfilesManager({ profiles }: DeliveryProfilesManagerProps) {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) =>
    t(`orders.submit.saved.${key}`, options);

  const [items, setItems] = useState<DeliveryProfile[]>(profiles);
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id ?? '');
  const [form, setForm] = useState<DeliveryProfilePayload>(() => profileToForm(profiles[0]));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null
  );

  const selectProfile = (profileId: string) => {
    setSelectedId(profileId);
    const profile = profileId ? items.find((item) => item.id === profileId) : null;
    setForm(profileToForm(profile));
  };

  const setField = <K extends keyof DeliveryProfilePayload>(
    field: K,
    value: DeliveryProfilePayload[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const setAddressField = (field: keyof DeliveryProfilePayload['address'], value: string) => {
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const validate = () => {
    if (
      !form.contactName.trim() ||
      !form.phone.trim() ||
      !form.address.road.trim() ||
      !form.address.postcode.trim() ||
      !form.address.city.trim()
    ) {
      setFeedback({ tone: 'error', text: tt('messages.missingFields') });
      return false;
    }
    if (!form.label?.trim()) {
      setFeedback({ tone: 'error', text: tt('messages.missingLabel') });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const profile = await UserApi.createDeliveryProfile(form);
      setItems((prev) => [...prev, profile]);
      setSelectedId(profile.id);
      setFeedback({ tone: 'success', text: tt('messages.saved') });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : tt('messages.genericError'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) {
      setFeedback({ tone: 'error', text: tt('messages.selectProfile') });
      return;
    }
    if (!validate()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const profile = await UserApi.updateDeliveryProfile(selectedId, form);
      setItems((prev) => prev.map((item) => (item.id === profile.id ? profile : item)));
      setFeedback({ tone: 'success', text: tt('messages.updated') });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : tt('messages.genericError'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      setFeedback({ tone: 'error', text: tt('messages.selectProfile') });
      return;
    }
    if (!globalThis.window.confirm(tt('confirmDelete'))) return;
    setBusy(true);
    setFeedback(null);
    try {
      await UserApi.deleteDeliveryProfile(selectedId);
      setItems((prev) => prev.filter((item) => item.id !== selectedId));
      setSelectedId('');
      setForm(getInitialDeliveryFormState());
      setFeedback({ tone: 'success', text: tt('messages.deleted') });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : tt('messages.genericError'),
      });
    } finally {
      setBusy(false);
    }
  };

  const profileCards = items.map((profile) => (
    <button
      key={profile.id}
      type="button"
      className={`flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition duration-200 ${
        profile.id === selectedId
          ? 'border-brand-400 bg-brand-500/10 text-white shadow-[0_12px_40px_rgba(99,102,241,0.25)]'
          : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-brand-400/40 hover:text-white'
      }`}
      onClick={() => selectProfile(profile.id)}
      disabled={busy}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-sm">{profile.label ?? tt('unnamedProfile')}</p>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-slate-300 uppercase tracking-wide">
          {t(`orders.submit.form.deliveryTypes.${profile.deliveryType}`)}
        </span>
      </div>
      <p className="text-slate-400 text-xs">
        {profile.contactName} • {profile.phone}
      </p>
      <p className="text-slate-500 text-xs">
        {profile.address.road}
        {profile.address.houseNumber ? ` ${profile.address.houseNumber}` : ''},&nbsp;
        {profile.address.postcode} {profile.address.city}
      </p>
    </button>
  ));

  const handleClearSelection = () => {
    setSelectedId('');
    setForm(getInitialDeliveryFormState());
    setFeedback(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start">
      <div className="space-y-5">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-5">
          <div className="space-y-1">
            <p className="font-semibold text-sm text-white">
              {t('orders.submit.form.sections.address.title')}
            </p>
            <p className="text-slate-400 text-xs">
              {t('orders.submit.form.sections.address.description')}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor="profileLabel">{tt('inputPlaceholder')}</Label>
              <Input
                id="profileLabel"
                value={form.label}
                disabled={busy}
                onChange={(event) => setField('label', event.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="contactName">{t('orders.submit.form.fields.customerName')}</Label>
              <Input
                id="contactName"
                value={form.contactName}
                disabled={busy}
                onChange={(event) => setField('contactName', event.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="phoneField">{t('orders.submit.form.fields.customerPhone')}</Label>
              <Input
                id="phoneField"
                value={form.phone}
                disabled={busy}
                onChange={(event) => setField('phone', event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <DeliveryTypeSelector
                selected={form.deliveryType}
                onSelect={(value) => setField('deliveryType', value)}
                disabled={busy}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="streetField">{t('orders.submit.form.fields.street')}</Label>
              <Input
                id="streetField"
                value={form.address.road}
                disabled={busy}
                onChange={(event) => setAddressField('road', event.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="houseNumberField">{t('orders.submit.form.fields.houseNumber')}</Label>
              <Input
                id="houseNumberField"
                value={form.address.houseNumber ?? ''}
                disabled={busy}
                onChange={(event) => setAddressField('houseNumber', event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="postcodeField">{t('orders.submit.form.fields.postcode')}</Label>
              <Input
                id="postcodeField"
                value={form.address.postcode}
                disabled={busy}
                onChange={(event) => setAddressField('postcode', event.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="cityField">{t('orders.submit.form.fields.city')}</Label>
              <Input
                id="cityField"
                value={form.address.city}
                disabled={busy}
                onChange={(event) => setAddressField('city', event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="stateField">{t('orders.submit.form.fields.state')}</Label>
              <select
                id="stateField"
                className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-brand-400 focus:outline-none disabled:opacity-60"
                value={form.address.state ?? ''}
                disabled={busy}
                onChange={(event) => setAddressField('state', event.target.value)}
              >
                {SWISS_CANTONS.map((canton) => (
                  <option key={canton.code} value={canton.code}>
                    {canton.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="countryField">{t('orders.submit.form.fields.country')}</Label>
              <Input id="countryField" value={SWITZERLAND_COUNTRY} disabled readOnly />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSave}
              disabled={busy}
              className="gap-1"
            >
              {tt('actions.save')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleUpdate}
              disabled={busy || !selectedId}
            >
              {tt('actions.update')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-rose-300 hover:text-rose-200"
              onClick={handleDelete}
              disabled={busy || !selectedId}
            >
              <Trash2 size={16} />
              {tt('actions.delete')}
            </Button>
          </div>
          {feedback ? (
            <Alert tone={feedback.tone === 'success' ? 'success' : 'error'}>{feedback.text}</Alert>
          ) : null}
        </section>
      </div>

      <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="font-semibold text-sm text-white">{tt('title')}</p>
            <p className="text-slate-400 text-xs">{tt('description')}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            disabled={busy}
          >
            {tt('actions.clear')}
          </Button>
        </div>

        <div className="mt-4 flex-1 space-y-4">
          {items.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">{profileCards}</div>
          ) : (
            <div className="rounded-2xl border border-white/10 border-dashed bg-slate-900/30 p-6 text-center text-slate-400 text-sm">
              {tt('selectPlaceholder')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
