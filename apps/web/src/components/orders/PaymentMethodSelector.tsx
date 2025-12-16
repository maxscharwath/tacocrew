import { Banknote, CheckCircle2, CreditCard, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PaymentMethod } from '@/lib/api/types';
import { cn } from '@/lib/utils';

type PaymentMethodSelectorProps = Readonly<{
  selected: PaymentMethod | undefined;
  onSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
  required?: boolean;
}>;

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { icon: typeof CreditCard; labelKey: string }> =
  {
    especes: {
      icon: Banknote,
      labelKey: 'form.paymentMethods.especes',
    },
    carte: {
      icon: CreditCard,
      labelKey: 'form.paymentMethods.carte',
    },
    twint: {
      icon: Phone,
      labelKey: 'form.paymentMethods.twint',
    },
  };

export function PaymentMethodSelector({
  selected,
  onSelect,
  disabled = false,
  required = false,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();
  const methods: PaymentMethod[] = ['especes', 'carte', 'twint'];

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <label className="font-medium text-sm text-white">
          {t('orders.submit.form.fields.paymentMethod')}
          {required && <span className="ml-1 text-rose-400">*</span>}
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {methods.map((method) => {
          const config = PAYMENT_METHOD_CONFIG[method];
          const Icon = config.icon;
          const isSelected = selected === method;

          return (
            <button
              key={method}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(method)}
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
                  <Icon size={24} className={isSelected ? 'text-brand-300' : 'text-slate-400'} />
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-slate-900 bg-brand-500">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-1 text-center">
                <span className="block font-semibold text-sm text-white">
                  {t(`orders.submit.${config.labelKey}`)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {selected && <input type="hidden" name="paymentMethod" value={selected} />}
    </div>
  );
}
