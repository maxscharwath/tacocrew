import { AlarmClock, Calendar } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group';
import { Label } from './label';
import { cn } from './utils';

type DateTimePickerProps = {
  readonly label: string;
  readonly dateValue: string; // ISO date string (YYYY-MM-DD)
  readonly timeValue: string; // Time string (HH:MM)
  readonly onDateChange: (date: string) => void;
  readonly onTimeChange: (time: string) => void;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly minDate?: string; // ISO date string
  readonly maxDate?: string; // ISO date string
  readonly error?: boolean;
  readonly className?: string;
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
        <InputGroup>
          <InputGroupAddon>
            <Calendar className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={disabled}
            required={required}
            min={minDate}
            max={maxDate}
            aria-invalid={error}
          />
        </InputGroup>

        {/* Time Picker */}
        <InputGroup>
          <InputGroupAddon>
            <AlarmClock className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={disabled}
            required={required}
            aria-invalid={error}
          />
        </InputGroup>
      </div>
    </div>
  );
}
