import { Button, Label } from '@tacocrew/ui-kit';
import { Building2, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface OrganizationAvatarPickerProps {
  readonly preview: string | null;
  readonly onFileSelect: (file: File) => void;
  readonly onRemove: () => void;
  readonly disabled?: boolean;
}

export function OrganizationAvatarPicker({
  preview,
  onFileSelect,
  onRemove,
  disabled = false,
}: OrganizationAvatarPickerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">{t('organizations.details.avatar.title')}</Label>
        <p className="mt-1 text-slate-400 text-sm">
          {t('organizations.details.avatar.description')}
        </p>
      </div>
      <div className="flex items-start gap-6">
        <div className="shrink-0">
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="size-24 rounded-xl border border-white/10 object-cover shadow-lg transition-all duration-200"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-lg transition-all duration-200 hover:border-brand-400/30">
              <Building2 className="size-10 text-slate-400" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="gap-2"
          >
            <Upload size={16} />
            {preview
              ? t('organizations.details.avatar.change')
              : t('organizations.details.avatar.upload')}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="destructive"
              onClick={onRemove}
              disabled={disabled}
              className="gap-2"
            >
              <Trash2 size={16} />
              {t('organizations.details.avatar.delete')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
