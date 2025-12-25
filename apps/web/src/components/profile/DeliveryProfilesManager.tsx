import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Field,
  FieldError,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tacocrew/ui-kit';
import { Globe, Hash, MapPin, Tag, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { DeliveryTypeSelector } from '@/components/orders/DeliveryTypeSelector';
import {
  DEFAULT_CANTON_CODE,
  getSwissCantons,
  getSwitzerlandName,
  SWITZERLAND_COUNTRY,
} from '@/constants/location';
import { useZodForm } from '@/hooks/useZodForm';
import type { DeliveryProfile } from '@/lib/api/types';
import {
  createDeliveryProfile,
  deleteDeliveryProfile,
  updateDeliveryProfile,
} from '@/lib/api/user';
import { type DeliveryProfileFormData, deliveryProfileSchema } from '@/lib/schemas';
import { formatPhoneNumber } from '@/utils/phone-formatter';

const EMPTY_FORM_DATA: DeliveryProfileFormData = {
  label: '',
  contactName: '',
  phone: '',
  deliveryType: 'livraison',
  address: {
    road: '',
    houseNumber: '',
    postcode: '',
    city: '',
    state: DEFAULT_CANTON_CODE,
    country: SWITZERLAND_COUNTRY,
  },
};

function profileToFormData(profile: DeliveryProfile | null | undefined): DeliveryProfileFormData {
  if (!profile) {
    return EMPTY_FORM_DATA;
  }

  return {
    label: profile.label ?? '',
    contactName: profile.contactName,
    phone: profile.phone,
    deliveryType: profile.deliveryType,
    address: {
      road: profile.address.road,
      houseNumber: profile.address.houseNumber ?? '',
      postcode: profile.address.postcode,
      city: profile.address.city,
      state: profile.address.state ?? DEFAULT_CANTON_CODE,
      country: profile.address.country,
    },
  };
}

interface ProfileCardProps {
  readonly profile: DeliveryProfile;
  readonly isSelected: boolean;
  readonly isDisabled: boolean;
  readonly onSelect: (profileId: string) => void;
}

function ProfileCard({ profile, isSelected, isDisabled, onSelect }: ProfileCardProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition duration-200 ${
        isSelected
          ? 'border-brand-400 bg-brand-500/10 text-white shadow-[0_12px_40px_rgba(99,102,241,0.25)]'
          : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-brand-400/40 hover:text-white'
      }`}
      onClick={() => onSelect(profile.id)}
      disabled={isDisabled}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-sm">
          {profile.label ?? t(`orders.submit.saved.unnamedProfile`)}
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
      </p>
    </button>
  );
}

interface DeliveryProfileFormFieldsProps {
  readonly form: UseFormReturn<DeliveryProfileFormData>;
}

function DeliveryProfileFormFields({ form }: DeliveryProfileFormFieldsProps) {
  const { t } = useTranslation();
  const {
    control,
    formState: { isSubmitting },
  } = form;

  return (
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
        <Controller
          name="label"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="profileLabel">
                {t(`orders.submit.saved.inputPlaceholder`)}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Tag className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="profileLabel"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="contactName"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contactName" required>
                {t('orders.submit.form.fields.customerName')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <User className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="contactName"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="phoneField" required>
                {t('orders.submit.form.fields.customerPhone')}
              </FieldLabel>
              <PhoneInput
                {...field}
                id="phoneField"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="deliveryType"
          control={control}
          render={({ field }) => (
            <div className="sm:col-span-2">
              <DeliveryTypeSelector
                selected={field.value}
                onSelect={field.onChange}
                disabled={isSubmitting}
                required
              />
            </div>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="address.road"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="streetField" required>
                {t('orders.submit.form.fields.street')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <MapPin className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="streetField"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="address.houseNumber"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="houseNumberField">
                {t('orders.submit.form.fields.houseNumber')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Hash className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="houseNumberField"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="address.postcode"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="postcodeField" required>
                {t('orders.submit.form.fields.postcode')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Hash className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="postcodeField"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="address.city"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="cityField" required>
                {t('orders.submit.form.fields.city')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <MapPin className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="cityField"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="address.state"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="stateField">{t('orders.submit.form.fields.state')}</FieldLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <SelectTrigger id="stateField" className="w-full">
                  <SelectValue placeholder={t('orders.submit.form.fields.state')} />
                </SelectTrigger>
                <SelectContent>
                  {getSwissCantons(t).map((canton) => (
                    <SelectItem key={canton.code} value={canton.code}>
                      {canton.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <Field>
          <FieldLabel htmlFor="countryField">{t('orders.submit.form.fields.country')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Globe className="size-4" />
            </InputGroupAddon>
            <InputGroupInput id="countryField" value={getSwitzerlandName(t)} disabled readOnly />
          </InputGroup>
        </Field>
      </div>
    </section>
  );
}

interface DeliveryProfilesManagerProps {
  readonly profiles: DeliveryProfile[];
}

export function DeliveryProfilesManager({ profiles }: DeliveryProfilesManagerProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<DeliveryProfile[]>(profiles);
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id ?? '');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const form = useZodForm({
    schema: deliveryProfileSchema,
    defaultValues: profileToFormData(profiles[0]),
  });

  const selectProfile = (profileId: string) => {
    setSelectedId(profileId);
    const profile = profileId ? items.find((item) => item.id === profileId) : null;
    form.reset(profileToFormData(profile));
    setFeedback(null);
  };

  const handleSave = async (data: DeliveryProfileFormData) => {
    setFeedback(null);
    try {
      const profile = await createDeliveryProfile(data);
      setItems((prev) => [...prev, profile]);
      setSelectedId(profile.id);
      setFeedback({ tone: 'success', text: t(`orders.submit.saved.messages.saved`) });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text:
          error instanceof Error ? error.message : t(`orders.submit.saved.messages.genericError`),
      });
    }
  };

  const handleUpdate = async (data: DeliveryProfileFormData) => {
    if (!selectedId) {
      setFeedback({ tone: 'error', text: t(`orders.submit.saved.messages.selectProfile`) });
      return;
    }
    setFeedback(null);
    try {
      const profile = await updateDeliveryProfile(selectedId, data);
      setItems((prev) => prev.map((item) => (item.id === profile.id ? profile : item)));
      setFeedback({ tone: 'success', text: t(`orders.submit.saved.messages.updated`) });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text:
          error instanceof Error ? error.message : t(`orders.submit.saved.messages.genericError`),
      });
    }
  };

  const handleDelete = () => {
    if (!selectedId) {
      setFeedback({ tone: 'error', text: t(`orders.submit.saved.messages.selectProfile`) });
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;

    setShowDeleteDialog(false);
    setFeedback(null);
    try {
      await deleteDeliveryProfile(selectedId);
      setItems((prev) => prev.filter((item) => item.id !== selectedId));
      setSelectedId('');
      selectProfile('');
      setFeedback({ tone: 'success', text: t(`orders.submit.saved.messages.deleted`) });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text:
          error instanceof Error ? error.message : t(`orders.submit.saved.messages.genericError`),
      });
    }
  };

  const handleClearSelection = () => {
    selectProfile('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start">
      <div className="space-y-5">
        <DeliveryProfileFormFields form={form} />

        <section className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit(handleSave)}
              disabled={form.formState.isSubmitting}
              className="gap-1"
            >
              {t(`orders.submit.saved.actions.save`)}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={form.handleSubmit(handleUpdate)}
              disabled={form.formState.isSubmitting || !selectedId}
            >
              {t(`orders.submit.saved.actions.update`)}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-rose-300 hover:text-rose-200"
              onClick={handleDelete}
              disabled={form.formState.isSubmitting || !selectedId}
            >
              <Trash2 size={16} />
              {t(`orders.submit.saved.actions.delete`)}
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
            <p className="font-semibold text-sm text-white">{t(`orders.submit.saved.title`)}</p>
            <p className="text-slate-400 text-xs">{t(`orders.submit.saved.description`)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            disabled={form.formState.isSubmitting}
          >
            {t(`orders.submit.saved.actions.clear`)}
          </Button>
        </div>

        <div className="mt-4 flex-1 space-y-4">
          {items.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  isSelected={profile.id === selectedId}
                  isDisabled={form.formState.isSubmitting}
                  onSelect={selectProfile}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 border-dashed bg-slate-900/30 p-6 text-center text-slate-400 text-sm">
              {t(`orders.submit.saved.selectPlaceholder`)}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`orders.submit.saved.delete`)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(`orders.submit.saved.confirmDelete`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={form.formState.isSubmitting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={form.formState.isSubmitting}
            >
              {t(`orders.submit.saved.delete`)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
