import { AlarmClock } from '@untitledui/icons/AlarmClock';
import { Calendar } from '@untitledui/icons/Calendar';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';

type DateTimePickerProps = {
  label: string;
  dateValue: string; // ISO date string (YYYY-MM-DD)
  timeValue: string; // Time string (HH:MM)
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
  required?: boolean;
  minDate?: string; // ISO date string
  maxDate?: string; // ISO date string
  error?: boolean;
  className?: string;
};

export function DateTimePicker({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  error = false,
  className,
}: DateTimePickerProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label className="text-white text-xs normal-case">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {/* Date Picker with improved styling */}
        <div className="relative">
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={disabled}
            required={required}
            min={minDate}
            max={maxDate}
            error={error}
            className="pr-10"
          />
          <div className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3">
            <Calendar size={18} className="text-slate-500" />
          </div>
        </div>

        {/* Time Picker */}
        <div className="relative">
          <AlarmClock
            size={18}
            className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 z-10 text-slate-500"
          />
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={disabled}
            required={required}
            error={error}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
}
