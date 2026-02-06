import {
  Field,
  FieldError,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@tacocrew/ui-kit';
import { Banknote, CheckCircle2, Clock, CreditCard, Phone } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { PaymentMethod } from '@/lib/api/types';
import type { DeliveryFormData } from '@/lib/schemas/delivery-form.schema';
import { cn } from '@/lib/utils';

type PreferencesSectionProps = Readonly<{
  form: UseFormReturn<DeliveryFormData>;
  disabled?: boolean;
}>;

// Special value for "As soon as possible" - Radix UI Select doesn't allow empty string values
const ASAP_VALUE = '__asap__';

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { icon: typeof CreditCard }> = {
  especes: { icon: Banknote },
  carte: { icon: CreditCard },
  twint: { icon: Phone },
};

/**
 * Generates time slots every 10 minutes from 00:00 to 23:50
 */
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
}

export function PreferencesSection({ form, disabled = false }: PreferencesSectionProps) {
  const { t } = useTranslation();
  const timeSlots = generateTimeSlots();
  const paymentMethods: PaymentMethod[] = ['especes', 'carte', 'twint'];

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-3 sm:p-5">
      <div className="space-y-1">
        <p className="font-semibold text-sm text-white">
          {t('orders.submit.form.sections.preferences.title')}
        </p>
        <p className="text-slate-400 text-xs">
          {t('orders.submit.form.sections.preferences.description')}
        </p>
      </div>

      {/* Time Slot Selector */}
      <Controller
        name="requestedFor"
        control={form.control}
        render={({ field, fieldState }) => {
          const selectValue = field.value === '' || !field.value ? ASAP_VALUE : field.value;

          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="requestedFor" required>
                {t('orders.submit.form.fields.requestedFor')}
              </FieldLabel>
              <div className="relative">
                <Clock
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-slate-500"
                />
                <Select
                  value={selectValue}
                  onValueChange={(value) => field.onChange(value === ASAP_VALUE ? '' : value)}
                  disabled={disabled}
                >
                  <SelectTrigger id="requestedFor" className="w-full pl-10">
                    <SelectValue placeholder={t('orders.submit.form.fields.asSoonAsPossible')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ASAP_VALUE}>
                      {t('orders.submit.form.fields.asSoonAsPossible')}
                    </SelectItem>
                    <SelectSeparator />
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />

      {/* Payment Method Selector */}
      <Controller
        name="paymentMethod"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="paymentMethod" required>
              {t('orders.submit.form.fields.paymentMethod')}
            </FieldLabel>
            <div className="grid gap-3 sm:grid-cols-3">
              {paymentMethods.map((method) => {
                const config = PAYMENT_METHOD_CONFIG[method];
                const IconComponent = config.icon;
                const isSelected = field.value === method;

                return (
                  <button
                    key={method}
                    type="button"
                    disabled={disabled}
                    onClick={() => field.onChange(method)}
                    className={cn(
                      'group relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border p-4 transition-all duration-200',
                      isSelected
                        ? 'scale-[1.02] border-brand-400/60 bg-linear-to-br from-brand-500/25 via-brand-500/15 to-sky-500/10 shadow-[0_8px_24px_rgba(99,102,241,0.35)]'
                        : 'border-white/10 bg-slate-800/50 hover:border-brand-400/40 hover:bg-slate-800/70 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div className="relative">
                      <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-slate-900/50 transition-transform duration-200 group-hover:scale-110">
                        <IconComponent
                          size={24}
                          className={isSelected ? 'text-brand-300' : 'text-slate-400'}
                        />
                      </div>
                      {isSelected && (
                        <CheckCircle2
                          size={14}
                          className="absolute -top-1 -right-1 h-6 w-6 rounded-full border-2 border-slate-900 bg-brand-500 text-white"
                        />
                      )}
                    </div>
                    <span className="text-center font-semibold text-sm text-white">
                      {t(`orders.submit.form.paymentMethods.${method}`)}
                    </span>
                  </button>
                );
              })}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </section>
  );
}
