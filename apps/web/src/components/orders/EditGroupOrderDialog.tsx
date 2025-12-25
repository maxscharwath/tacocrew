import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  DateTimePicker,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Modal,
} from '@tacocrew/ui-kit';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useUpdateGroupOrder } from '@/lib/api/orders';
import type { GroupOrder } from '@/lib/api/types';
import { type EditGroupOrderFormData, editGroupOrderSchema } from '@/lib/schemas';
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
  const updateGroupOrder = useUpdateGroupOrder();

  const form = useForm<EditGroupOrderFormData>({
    resolver: zodResolver(editGroupOrderSchema),
    defaultValues: {
      name: groupOrder.name ?? '',
      startDate: toDate(groupOrder.startDate).toISOString(),
      endDate: toDate(groupOrder.endDate).toISOString(),
    },
  });

  // Reset form when dialog opens/closes or groupOrder changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: groupOrder.name ?? '',
        startDate: toDate(groupOrder.startDate).toISOString(),
        endDate: toDate(groupOrder.endDate).toISOString(),
      });
    }
  }, [isOpen, groupOrder, form]);

  const handleSubmit = async (data: EditGroupOrderFormData) => {
    try {
      await updateGroupOrder.mutateAsync({
        groupOrderId: groupOrder.id,
        body: {
          name: data.name.trim() || null,
          startDate: data.startDate,
          endDate: data.endDate,
        },
      });

      onSuccess();
      onClose();
    } catch (err) {
      form.setError('root', {
        type: 'manual',
        message: err instanceof Error ? err.message : t('orders.detail.edit.error.generic'),
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('orders.detail.edit.title')}
      description={t('orders.detail.edit.description')}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="orderName">{t('common.labels.dropName')}</FieldLabel>
              <Input
                {...field}
                id="orderName"
                type="text"
                placeholder={t('common.placeholders.dropName')}
                disabled={form.formState.isSubmitting || updateGroupOrder.isPending}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div className="grid gap-4">
            <Controller
              name="startDate"
              control={form.control}
              render={({ field, fieldState }) => {
                const date = new Date(field.value);
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <DateTimePicker
                      label={t('orders.list.form.labels.opens')}
                      dateValue={format(date, 'yyyy-MM-dd')}
                      timeValue={format(date, 'HH:mm')}
                      onDateChange={(newDate) => {
                        const time = format(date, 'HH:mm');
                        field.onChange(new Date(`${newDate}T${time}`).toISOString());
                      }}
                      onTimeChange={(newTime) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        field.onChange(new Date(`${dateStr}T${newTime}`).toISOString());
                      }}
                      disabled={form.formState.isSubmitting || updateGroupOrder.isPending}
                      required
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />

            <Controller
              name="endDate"
              control={form.control}
              render={({ field, fieldState }) => {
                const date = new Date(field.value);
                const startDate = new Date(form.getValues('startDate'));
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <DateTimePicker
                      label={t('orders.list.form.labels.closes')}
                      dateValue={format(date, 'yyyy-MM-dd')}
                      timeValue={format(date, 'HH:mm')}
                      onDateChange={(newDate) => {
                        const time = format(date, 'HH:mm');
                        field.onChange(new Date(`${newDate}T${time}`).toISOString());
                      }}
                      onTimeChange={(newTime) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        field.onChange(new Date(`${dateStr}T${newTime}`).toISOString());
                      }}
                      disabled={form.formState.isSubmitting || updateGroupOrder.isPending}
                      required
                      minDate={format(startDate, 'yyyy-MM-dd')}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          </div>
        </div>

        {form.formState.errors.root && (
          <Alert tone="error">{form.formState.errors.root.message}</Alert>
        )}

        <div className="flex justify-end gap-3 border-white/10 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={form.formState.isSubmitting || updateGroupOrder.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="default" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting || updateGroupOrder.isPending
              ? t('common.saving')
              : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
