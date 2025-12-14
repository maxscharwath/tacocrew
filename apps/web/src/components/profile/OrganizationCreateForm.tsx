import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tacocrew/ui-kit';
import { Building2, Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormField } from '@/components/forms';
import { OrganizationAvatarPicker } from '@/components/profile/OrganizationAvatarPicker';
import { useZodForm } from '@/hooks/useZodForm';
import type { OrganizationPayload } from '@/lib/api/types';
import { type CreateOrganizationFormData, createOrganizationSchema } from '@/lib/schemas';

interface OrganizationCreateFormProps {
  readonly onSubmit: (
    data: OrganizationPayload,
    avatarFile: File | null,
    backgroundColor: string | null
  ) => Promise<void>;
  readonly onCancel: () => void;
  readonly disabled?: boolean;
}

export function OrganizationCreateForm({
  onSubmit,
  onCancel,
  disabled = false,
}: OrganizationCreateFormProps) {
  const { t } = useTranslation();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBackgroundColor, setAvatarBackgroundColor] = useState<string | null>(null);

  const form = useZodForm({
    schema: createOrganizationSchema,
    defaultValues: {
      name: '',
      avatar: undefined,
    },
  });

  const handleAvatarFileSelect = (file: File) => {
    // Zod will validate the file, but we need to set the preview
    form.setValue('avatar', file, { shouldValidate: true });

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    form.setValue('avatar', undefined, { shouldValidate: true });
    setAvatarPreview(null);
    setAvatarBackgroundColor(null);
  };

  const handleSubmit = async (data: CreateOrganizationFormData) => {
    try {
      const payload: OrganizationPayload = { name: data.name };
      await onSubmit(payload, data.avatar ?? null, avatarBackgroundColor);
      // Reset form on success
      form.reset();
      setAvatarPreview(null);
      setAvatarBackgroundColor(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      form.setError('root', {
        type: 'manual',
        message: errorMessage,
      });
    }
  };

  return (
    <Card className="fade-in-50 slide-in-from-bottom-4 animate-in duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-brand-500/20">
            <Plus className="size-6 text-brand-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">{t('organizations.form.create')}</CardTitle>
            <CardDescription className="mt-1">
              {t('organizations.form.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {form.formState.errors.root && (
            <Alert tone="error" className="fade-in slide-in-from-top-2 animate-in">
              <p className="text-sm">{form.formState.errors.root.message}</p>
            </Alert>
          )}

          {/* Avatar Upload Section */}
          <Controller
            name="avatar"
            control={form.control}
            render={({ fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4 transition-all duration-200 hover:border-brand-400/20">
                  <OrganizationAvatarPicker
                    preview={avatarPreview}
                    onFileSelect={handleAvatarFileSelect}
                    onRemove={handleRemoveAvatar}
                    disabled={disabled || form.formState.isSubmitting}
                  />
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Name Input */}
          <FormField
            name="name"
            control={form.control}
            label={t('organizations.form.name.label')}
            required
          >
            {(field) => (
              <InputGroup>
                <InputGroupAddon>
                  <Building2 className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  name={field.name}
                  value={typeof field.value === 'string' ? field.value : ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  id="org-name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(handleSubmit)();
                    }
                  }}
                  placeholder={t('organizations.form.name.placeholder')}
                  disabled={disabled || form.formState.isSubmitting}
                  autoFocus
                  className="text-base"
                />
              </InputGroup>
            )}
          </FormField>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              disabled={disabled || form.formState.isSubmitting}
              size="lg"
              className="gap-2"
            >
              <Check size={18} />
              {t('organizations.form.create')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={disabled || form.formState.isSubmitting}
              size="lg"
              className="gap-2"
            >
              <X size={18} />
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
