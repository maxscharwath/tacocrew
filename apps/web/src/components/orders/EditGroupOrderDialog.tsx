import { format } from 'date-fns';
import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DateTimePicker, Input, Label, Modal } from '@/components/ui';
import { OrdersApi } from '@/lib/api';
import type { GroupOrder } from '@/lib/api/types';
import { toDate } from '@/lib/utils/date';

type EditGroupOrderDialogProps = {
  readonly groupOrder: GroupOrder;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
};

export function EditGroupOrderDialog({
  groupOrder,
  isOpen,
  onClose,
  onSuccess,
}: EditGroupOrderDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(groupOrder.name ?? '');
  const [startDate, setStartDate] = useState(() => {
    const date = toDate(groupOrder.startDate);
    return format(date, 'yyyy-MM-dd');
  });
  const [startTime, setStartTime] = useState(() => {
    const date = toDate(groupOrder.startDate);
    return format(date, 'HH:mm');
  });
  const [endDate, setEndDate] = useState(() => {
    const date = toDate(groupOrder.endDate);
    return format(date, 'yyyy-MM-dd');
  });
  const [endTime, setEndTime] = useState(() => {
    const date = toDate(groupOrder.endDate);
    return format(date, 'HH:mm');
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or groupOrder changes
  useEffect(() => {
    if (isOpen) {
      setName(groupOrder.name ?? '');
      const start = toDate(groupOrder.startDate);
      const end = toDate(groupOrder.endDate);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));
      setError(null);
    }
  }, [isOpen, groupOrder]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      if (endDateTime <= startDateTime) {
        setError(t('orders.detail.edit.error.endDateTimeBeforeStart'));
        setIsSaving(false);
        return;
      }

      await OrdersApi.updateGroupOrder(groupOrder.id, {
        name: name.trim() || null,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update group order:', err);
      setError(err instanceof Error ? err.message : t('orders.detail.edit.error.generic'));
    } finally {
      setIsSaving(false);
    }
  };

  // Validate end date/time against start date/time
  const validateEndDateTime = (
    checkEndDate: string = endDate,
    checkEndTime: string = endTime,
    checkStartDate: string = startDate,
    checkStartTime: string = startTime
  ) => {
    if (checkEndDate < checkStartDate) {
      return t('orders.detail.edit.error.endDateBeforeStart');
    }
    if (checkEndDate === checkStartDate && checkEndTime <= checkStartTime) {
      return t('orders.detail.edit.error.endTimeBeforeStart');
    }
    return null;
  };

  // Update error when end date changes
  const handleEndDateChange = (newDate: string) => {
    setEndDate(newDate);
    // Validate with the new date
    const validationError = validateEndDateTime(newDate, endTime, startDate, startTime);
    setError(validationError);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('orders.detail.edit.title')}
      description={t('orders.detail.edit.description')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="orderName">{t('common.labels.dropName')}</Label>
          <Input
            id="orderName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('common.placeholders.dropName')}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div className="grid gap-4">
            <DateTimePicker
              label={t('orders.list.form.labels.opens')}
              dateValue={startDate}
              timeValue={startTime}
              onDateChange={(newDate) => {
                setStartDate(newDate);
                // If end date is before new start date, update end date to start date
                if (endDate < newDate) {
                  setEndDate(newDate);
                }
                // Re-validate after date change
                const validationError = validateEndDateTime(
                  endDate < newDate ? newDate : endDate,
                  endTime,
                  newDate,
                  startTime
                );
                setError(validationError);
              }}
              onTimeChange={(newTime) => {
                setStartTime(newTime);
                // Re-validate after time change
                const validationError = validateEndDateTime(endDate, endTime, startDate, newTime);
                setError(validationError);
              }}
              disabled={isSaving}
              required
            />

            <DateTimePicker
              label={t('orders.list.form.labels.closes')}
              dateValue={endDate}
              timeValue={endTime}
              onDateChange={handleEndDateChange}
              onTimeChange={(newTime) => {
                setEndTime(newTime);
                // Re-validate after time change
                const validationError = validateEndDateTime(endDate, newTime, startDate, startTime);
                setError(validationError);
              }}
              disabled={isSaving}
              required
              minDate={startDate}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3">
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 border-white/10 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="default" disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
