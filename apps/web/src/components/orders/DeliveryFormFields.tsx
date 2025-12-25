import {
  Field,
  FieldError,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tacocrew/ui-kit';
import { Globe, Hash, MapPin, User } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { DeliveryTypeSelector } from '@/components/orders/DeliveryTypeSelector';
import { getSwissCantons, getSwitzerlandName, SWITZERLAND_COUNTRY } from '@/constants/location';
import type { DeliveryFormData } from '@/lib/schemas/delivery-form.schema';

type DeliveryFormFieldsProps = Readonly<{
  form: UseFormReturn<DeliveryFormData>;
  disabled?: boolean;
}>;

export function DeliveryFormFields({ form, disabled = false }: DeliveryFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-3 sm:space-y-5 sm:p-5">
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
          name="customerName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="customerName" required>
                {t('orders.submit.form.fields.customerName')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <User className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="customerName"
                  type="text"
                  required
                  disabled={disabled}
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="customerPhone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="customerPhone" required>
                {t('orders.submit.form.fields.customerPhone')}
              </FieldLabel>
              <PhoneInput
                {...field}
                id="customerPhone"
                required
                disabled={disabled}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <DeliveryTypeSelector
        selected={form.watch('deliveryType')}
        onSelect={(value) => form.setValue('deliveryType', value)}
        disabled={disabled}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="road"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="road" required>
                {t('orders.submit.form.fields.street')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <MapPin className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="road"
                  type="text"
                  required
                  disabled={disabled}
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="houseNumber"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="houseNumber">
                {t('orders.submit.form.fields.houseNumber')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Hash className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="houseNumber"
                  type="text"
                  disabled={disabled}
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
          name="postcode"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="postcode" required>
                {t('orders.submit.form.fields.postcode')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Hash className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="postcode"
                  type="text"
                  required
                  disabled={disabled}
                  aria-invalid={fieldState.invalid}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="city"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="city" required>
                {t('orders.submit.form.fields.city')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <MapPin className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="city"
                  type="text"
                  required
                  disabled={disabled}
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
          name="stateRegion"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="state" required>
                {t('orders.submit.form.fields.state')}
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <SelectTrigger id="state" className="w-full" aria-invalid={fieldState.invalid}>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid gap-2">
          <Label htmlFor="country">{t('orders.submit.form.fields.country')}</Label>
          <InputGroup>
            <InputGroupAddon>
              <Globe className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="country"
              name="country"
              type="text"
              value={getSwitzerlandName(t)}
              readOnly
              disabled
            />
          </InputGroup>
        </div>
      </div>

      <input type="hidden" name="country" value={SWITZERLAND_COUNTRY} />
    </section>
  );
}
