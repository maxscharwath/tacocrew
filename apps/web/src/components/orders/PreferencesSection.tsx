import { useTranslation } from 'react-i18next';
import { PaymentMethodSelector } from '@/components/orders/PaymentMethodSelector';
import { TimeSlotSelector } from '@/components/orders/TimeSlotSelector';
import type { PaymentMethod } from '@/lib/api/types';

type PreferencesSectionProps = {
  readonly requestedFor: string;
  readonly setRequestedFor: (value: string) => void;
  readonly paymentMethod: PaymentMethod;
  readonly setPaymentMethod: (value: PaymentMethod) => void;
  readonly disabled?: boolean;
};

export function PreferencesSection({
  requestedFor,
  setRequestedFor,
  paymentMethod,
  setPaymentMethod,
  disabled = false,
}: PreferencesSectionProps) {
  const { t } = useTranslation();

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

      <TimeSlotSelector
        selected={requestedFor}
        onSelect={setRequestedFor}
        disabled={disabled}
        required
      />

      <PaymentMethodSelector
        selected={paymentMethod}
        onSelect={setPaymentMethod}
        disabled={disabled}
        required
      />
    </section>
  );
}
