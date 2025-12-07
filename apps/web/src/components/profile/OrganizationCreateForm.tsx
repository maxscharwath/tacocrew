import { Building2, Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OrganizationAvatarPicker } from '@/components/profile/OrganizationAvatarPicker';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
} from '@/components/ui';
import type { OrganizationPayload } from '@/lib/api/types';

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
  const [form, setForm] = useState<OrganizationPayload>({ name: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBackgroundColor, setAvatarBackgroundColor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    if (!form.name.trim()) {
      setFeedback({ tone: 'error', text: t('organizations.messages.missingName') });
      return false;
    }
    return true;
  };

  const handleAvatarFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFeedback({
        tone: 'error',
        text: t('account.avatar.invalidType') || 'Invalid file type. Only images are allowed.',
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFeedback({
        tone: 'error',
        text: t('account.avatar.fileTooLarge') || 'File is too large. Maximum size is 5MB.',
      });
      return;
    }

    setAvatarFile(file);
    setFeedback(null);

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
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarBackgroundColor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await onSubmit(form, avatarFile, avatarBackgroundColor);
      // Reset form on success
      setForm({ name: '' });
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarBackgroundColor(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('organizations.messages.genericError');
      setFeedback({ tone: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
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
              {t('organizations.empty.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {feedback && (
            <Alert tone={feedback.tone} className="fade-in slide-in-from-top-2 animate-in">
              <p className="text-sm">{feedback.text}</p>
            </Alert>
          )}

          {/* Avatar Upload Section */}
          <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4 transition-all duration-200 hover:border-brand-400/20">
            <OrganizationAvatarPicker
              preview={avatarPreview}
              onFileSelect={handleAvatarFileSelect}
              onRemove={handleRemoveAvatar}
              disabled={disabled || isSubmitting}
            />
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="org-name" className="font-medium text-base">
              {t('organizations.form.name.label')}
            </Label>
            <InputGroup>
              <InputGroupAddon>
                <Building2 className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="org-name"
                value={form.name}
                onChange={(e) => {
                  setForm({ name: e.target.value });
                  setFeedback(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={t('organizations.form.name.placeholder')}
                disabled={disabled || isSubmitting}
                autoFocus
                className="text-base"
              />
            </InputGroup>
            <p className="text-slate-400 text-xs">
              {t('organizations.form.name.description') ||
                'Choose a unique name for your organization'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={disabled || isSubmitting || !form.name.trim()}
              size="lg"
              className="flex-1 gap-2"
            >
              <Check size={18} />
              {t('organizations.form.create')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={disabled || isSubmitting}
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
