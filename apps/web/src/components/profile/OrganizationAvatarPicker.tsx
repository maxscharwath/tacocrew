import { Building2, Camera, X } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Label } from '@/components/ui';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base">{t('organizations.details.avatar.title')}</Label>
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Avatar preview"
                className="size-24 rounded-xl border border-white/10 object-cover shadow-lg transition-all duration-200"
              />
              <button
                type="button"
                onClick={onRemove}
                className="-right-2 -top-2 absolute flex size-6 items-center justify-center rounded-full bg-rose-500 text-white transition-all hover:scale-110 hover:bg-rose-600"
                disabled={disabled}
                aria-label={t('common.remove')}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex size-24 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-lg transition-all duration-200 hover:border-brand-400/30">
              <Building2 className="size-10 text-slate-400" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
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
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="gap-2"
            >
              <Camera size={16} />
              {preview
                ? t('organizations.details.avatar.change')
                : t('organizations.details.avatar.upload')}
            </Button>
          </div>
          <p className="text-slate-400 text-xs">{t('organizations.details.avatar.description')}</p>
        </div>
      </div>
    </div>
  );
}
