import { CheckCircle, ShoppingBag02, Truck01 } from '@untitledui/icons';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type DeliveryType = 'livraison' | 'emporter';

type DeliveryTypeSelectorProps = {
  selected: DeliveryType | undefined;
  onSelect: (type: DeliveryType) => void;
  disabled?: boolean;
  required?: boolean;
};

const DELIVERY_TYPE_CONFIG: Record<DeliveryType, { icon: typeof Truck01; labelKey: string }> = {
  livraison: {
    icon: Truck01,
    labelKey: 'form.deliveryTypes.livraison',
  },
  emporter: {
    icon: ShoppingBag02,
    labelKey: 'form.deliveryTypes.emporter',
  },
};

export function DeliveryTypeSelector({
  selected,
  onSelect,
  disabled = false,
  required = false,
}: Readonly<DeliveryTypeSelectorProps>) {
  const { t } = useTranslation();
  const types: DeliveryType[] = ['livraison', 'emporter'];

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <label className="font-medium text-sm text-white">
          {t('orders.submit.form.fields.deliveryType')}
          {required && <span className="ml-1 text-rose-400">*</span>}
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {types.map((type) => {
          const config = DELIVERY_TYPE_CONFIG[type];
          const Icon = config.icon;
          const isSelected = selected === type;

          return (
            <div
              key={type}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onClick={() => !disabled && onSelect(type)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(type);
                }
              }}
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
                  <div className="-top-1 -right-1 absolute grid h-6 w-6 place-items-center rounded-full border-2 border-slate-900 bg-brand-500">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-1 text-center">
                <span className="block font-semibold text-sm text-white">
                  {t(`orders.submit.${config.labelKey}`)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {selected && <input type="hidden" name="deliveryType" value={selected} />}
    </div>
  );
}
