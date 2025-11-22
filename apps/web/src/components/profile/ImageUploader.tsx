import {
  Camera,
  Check,
  ImageUp,
  Loader2,
  MousePointerSquareDashed,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Avatar, type AvatarProps, Button } from '@/components/ui';
import { resolveImageUrl } from '@/lib/api';
import { deleteAvatar, uploadAvatar } from '@/lib/api/user';
import { cn } from '@/lib/utils';

type AvatarSize = NonNullable<AvatarProps['size']>;

interface ImageUploaderProps {
  currentImage?: string | null;
  onImageUpdate?: (image: string | null) => void;
  size?: AvatarSize;
}

const displaySizeMap: Record<AvatarSize, AvatarSize> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
  xl: '2xl',
  '2xl': '2xl',
};

const cameraSizeMap: Record<AvatarSize, number> = {
  sm: 18,
  md: 22,
  lg: 26,
  xl: 30,
  '2xl': 36,
};

export function ImageUploader({ currentImage, onImageUpdate, size = 'xl' }: ImageUploaderProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [_fileSize, setFileSize] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const normalizedSize = size ?? 'xl';
  const avatarSize = displaySizeMap[normalizedSize];
  const cameraSize = cameraSizeMap[avatarSize];
  const showDeleteButton = Boolean(preview && !pendingFile && !isUploading);

  const resolvePreviewImage = useCallback((value?: string | null): string | null => {
    if (!value) {
      return null;
    }
    if (value.startsWith('data:')) {
      return value;
    }
    return resolveImageUrl(value) ?? value;
  }, []);

  // Update preview when currentImage changes externally
  useEffect(() => {
    if (!pendingFile) {
      setPreview(resolvePreviewImage(currentImage));
    }
  }, [currentImage, pendingFile, resolvePreviewImage]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      successTimeoutRef.current = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => {
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
      };
    }
  }, [success]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }, []);

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError(t('account.avatar.invalidType') || 'Invalid file type. Only images are allowed.');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(t('account.avatar.fileTooLarge') || 'File is too large. Maximum size is 5MB.');
        return;
      }

      setError(null);
      setSuccess(false);
      setPendingFile(file);
      setFileSize(formatFileSize(file.size));

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [t, formatFileSize]
  );

  const handleConfirmUpload = useCallback(async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedProfile = await uploadAvatar(pendingFile);
      const normalizedImage = resolvePreviewImage(updatedProfile.image);
      setPreview(normalizedImage);
      setPendingFile(null);
      setFileSize(null);
      setSuccess(true);
      onImageUpdate?.(normalizedImage);
      // Trigger a custom event to notify other components
      const detail = { ...updatedProfile, image: normalizedImage };
      globalThis.dispatchEvent(new CustomEvent('userImageUpdated', { detail }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('account.avatar.uploadFailed') || 'Failed to upload image. Please try again.'
      );
      // Revert preview on error
      setPreview(resolvePreviewImage(currentImage));
    } finally {
      setIsUploading(false);
    }
  }, [pendingFile, currentImage, onImageUpdate, t, resolvePreviewImage]);

  const handleCancelPreview = useCallback(() => {
    setPreview(resolvePreviewImage(currentImage));
    setPendingFile(null);
    setFileSize(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [currentImage, resolvePreviewImage]);

  const handleDelete = useCallback(async () => {
    if (
      !confirm(
        t('account.avatar.deleteConfirm') || 'Are you sure you want to delete your profile image?'
      )
    ) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedProfile = await deleteAvatar();
      setPreview(null);
      setFileSize(null);
      onImageUpdate?.(null);
      // Trigger a custom event to notify other components
      const detail = { ...updatedProfile, image: null };
      globalThis.dispatchEvent(new CustomEvent('userImageUpdated', { detail }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('account.avatar.deleteFailed') || 'Failed to delete image. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpdate, t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (file) {
        handleFileSelect(file);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-5">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col gap-6 rounded-2xl border border-white/10 bg-linear-to-br from-slate-950/80 via-slate-900/60 to-slate-900/30 p-5 shadow-xl md:flex-row',
          isDragging && 'border-brand-400/70 bg-brand-500/10',
          isUploading && 'pointer-events-none opacity-70'
        )}
      >
        <div className="flex flex-shrink-0 basis-72 justify-center md:justify-start">
          <div className="relative w-full max-w-[18rem]" style={{ aspectRatio: '1 / 1' }}>
            <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/15 bg-linear-to-b from-slate-950/80 via-slate-900/60 to-slate-900/20 shadow-inner">
              <Avatar
                size={avatarSize}
                color="brandHero"
                variant="elevated"
                src={preview || undefined}
                alt="Profile"
                className={cn(
                  'absolute inset-6 h-auto w-auto rounded-2xl transition-all duration-300',
                  pendingFile && 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-900',
                  success &&
                    !isUploading &&
                    'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900'
                )}
              >
                {!preview && <Camera size={cameraSize} />}
              </Avatar>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          <label
            htmlFor={inputId}
            className="flex w-full cursor-pointer flex-col gap-3 rounded-2xl border border-white/15 border-dashed bg-slate-900/40 p-5 transition hover:border-brand-400/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/60 text-brand-200">
                {pendingFile ? (
                  <ImageUp size={20} />
                ) : isDragging ? (
                  <MousePointerSquareDashed size={20} />
                ) : (
                  <Upload size={20} />
                )}
              </div>
              <div>
                <p className="font-semibold text-base text-white">
                  {pendingFile
                    ? pendingFile.name
                    : t('account.avatar.dragDrop') || 'Drag and drop or browse'}
                </p>
                <p className="text-slate-400 text-sm">
                  {t('account.avatar.hint') ||
                    'JPG, PNG, WebP or GIF. Max 5MB. Image will be resized to 512x512px and converted to WebP.'}
                </p>
              </div>
            </div>
          </label>

          {pendingFile && (
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-4 text-brand-50 text-sm">
              <p className="font-semibold">
                {pendingFile.name} · {formatFileSize(pendingFile.size)}
              </p>
              <p>
                {t('account.avatar.confirmHint') ||
                  'Review your image and click "Confirm Upload" to save it.'}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {pendingFile ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  loading={isUploading}
                  className="gap-2"
                >
                  <Check size={16} />
                  {t('account.avatar.confirm') || 'Confirm Upload'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelPreview}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <X size={16} />
                  {t('account.avatar.cancel') || 'Cancel'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClick}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload size={16} />
                  {t('account.avatar.select') || 'Select Image'}
                </Button>
                {showDeleteButton && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isUploading}
                    className="gap-2 text-rose-400"
                  >
                    <Trash2 size={16} />
                    {t('account.avatar.delete') || 'Delete'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && !pendingFile && (
        <Alert tone="success" className="animate-[fadeIn_0.3s_ease-out]">
          <span>{t('account.avatar.uploadSuccess') || 'Profile image uploaded successfully!'}</span>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert tone="error" className="animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              {error.includes('Failed') && pendingFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    handleConfirmUpload();
                  }}
                  className="mt-2 h-auto p-0 text-xs"
                >
                  <RotateCcw size={14} className="mr-1" />
                  {t('account.avatar.retry') || 'Retry'}
                </Button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-slate-400 transition-colors hover:text-white"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        </Alert>
      )}
    </div>
  );
}
