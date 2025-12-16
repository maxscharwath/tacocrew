import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@tacocrew/ui-kit';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Special value for "As soon as possible" - Radix UI Select doesn't allow empty string values
const ASAP_VALUE = '__asap__';

type TimeSlotSelectorProps = {
  readonly selected: string | undefined;
  readonly onSelect: (time: string) => void;
  readonly disabled?: boolean;
  readonly required?: boolean;
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

  // Convert empty string to ASAP_VALUE for Radix UI Select
  const selectValue = selected === '' || !selected ? ASAP_VALUE : selected;

  // Convert ASAP_VALUE back to empty string when selected
  const handleValueChange = (value: string) => {
    onSelect(value === ASAP_VALUE ? '' : value);
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="requestedFor" className="font-medium text-sm text-white">
          {t('orders.submit.form.fields.requestedFor')}
          {required && <span className="ml-1 text-rose-400">*</span>}
        </Label>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2">
          <Clock size={18} className="text-slate-500" />
        </div>
        <input type="hidden" name="requestedFor" value={selected || ''} />
        <Select
          value={selectValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          required={required}
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
    </div>
  );
}
