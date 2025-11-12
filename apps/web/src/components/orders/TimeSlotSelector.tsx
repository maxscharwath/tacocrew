import { AlarmClock } from '@untitledui/icons/AlarmClock';
import { useTranslation } from 'react-i18next';
import { Label, Select } from '@/components/ui';

type TimeSlotSelectorProps = {
  selected: string | undefined;
  onSelect: (time: string) => void;
  disabled?: boolean;
  required?: boolean;
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

export function TimeSlotSelector({
  selected,
  onSelect,
  disabled = false,
  required = false,
}: TimeSlotSelectorProps) {
  const { t } = useTranslation();
  const timeSlots = generateTimeSlots();

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="requestedFor" className="font-medium text-sm text-white">
          {t('orders.submit.form.fields.requestedFor')}
          {required && <span className="ml-1 text-rose-400">*</span>}
        </Label>
      </div>
      <div className="relative">
        <div className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 z-10">
          <AlarmClock size={18} className="text-slate-500" />
        </div>
        <Select
          id="requestedFor"
          name="requestedFor"
          value={selected || ''}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
          required={required}
          className="pl-10"
        >
          <option value="">{t('orders.submit.form.fields.asSoonAsPossible')}</option>
          <option value="" disabled>
            ---
          </option>
          {timeSlots.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
