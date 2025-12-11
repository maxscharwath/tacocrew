import { Camera, Check, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  toast,
} from '@/components/ui';
import { deleteAvatar, uploadAvatar } from '@/lib/api/user';
import { imageUrlToFile, PREDEFINED_AVATAR_THUMBNAILS, PREDEFINED_AVATARS } from '@/lib/avatars';
import { ENV } from '@/lib/env';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const SUCCESS_MESSAGE_DURATION = 3000;

const PRESET_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Slate', value: '#1e293b' },
  { name: 'Brand', value: '#6366f1' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Orange', value: '#f97316' },
] as const;

interface ImageUploaderProps {
  readonly currentImage?: string | null;
  readonly onImageUpdate?: (image: string | null) => void;
}

/**
 * Calculate icon color based on background luminance
 */
function getIconColorForBackground(backgroundColor: string): string {
  if (backgroundColor === 'transparent') {
    return 'text-slate-400';
  }

  const hex = backgroundColor.replace('#', '');
  if (hex.length !== 3 && hex.length !== 6) {
    return 'text-slate-400';
  }

  // Parse hex to RGB
  const r = Number.parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = Number.parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = Number.parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'text-slate-700' : 'text-slate-300';
}

export function ImageUploader({ currentImage, onImageUpdate }: ImageUploaderProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize preview with currentImage immediately - resolve URL if needed
  const getInitialPreview = (): string | null => {
    if (currentImage && typeof currentImage === 'string' && currentImage.trim()) {
      // If it's a relative URL, resolve it to absolute using API base URL or current origin
      if (currentImage.startsWith('/')) {
        const baseUrl =
          ENV.apiBaseUrl ||
          (typeof globalThis.window !== 'undefined' ? globalThis.location.origin : '');
        return baseUrl + currentImage;
      }
      return currentImage;
    }
    return null;
  };

  const [preview, setPreview] = useState<string | null>(() => getInitialPreview());
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>(PRESET_COLORS[0].value);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasPendingSelection = Boolean(pendingFile || pendingAvatarUrl);
  const showDeleteButton = Boolean(preview && !hasPendingSelection && !isUploading);

  // Sync preview with currentImage when no pending changes
  useEffect(() => {
    if (!hasPendingSelection) {
      if (currentImage && typeof currentImage === 'string' && currentImage.trim()) {
        // Resolve relative URLs to absolute using API base URL or current origin
        let resolvedUrl = currentImage;
        if (currentImage.startsWith('/')) {
          const baseUrl =
            ENV.apiBaseUrl ||
            (typeof globalThis.window !== 'undefined' ? globalThis.location.origin : '');
          resolvedUrl = baseUrl + currentImage;
        }
        setPreview(resolvedUrl);
      } else {
        setPreview(null);
      }
    }
  }, [currentImage, hasPendingSelection]);

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      successTimeoutRef.current = setTimeout(() => setSuccess(false), SUCCESS_MESSAGE_DURATION);
      return () => {
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
      };
    }
  }, [success]);

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setError(t('account.avatar.invalidType') || 'Invalid file type. Only images are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t('account.avatar.fileTooLarge') || 'File is too large. Maximum size is 5MB.');
      return;
    }

    setError(null);
    setSuccess(false);
    setPendingFile(file);
    setPendingAvatarUrl(null);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePredefinedAvatarSelect = (avatarUrl: string) => {
    setError(null);
    setSuccess(false);
    setPendingAvatarUrl(avatarUrl);
    setPendingFile(null);
    setPreview(avatarUrl);
  };

  const handleConfirmUpload = async () => {
    const fileToUpload =
      pendingFile ||
      (pendingAvatarUrl ? await imageUrlToFile(pendingAvatarUrl, 'avatar.webp') : null);
    if (!fileToUpload) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedProfile = await uploadAvatar(fileToUpload, backgroundColor);

      const endpointUrl = updatedProfile.image || null;
      setPreview(endpointUrl);
      setPendingFile(null);
      setPendingAvatarUrl(null);
      setSuccess(true);
      toast.success(t('account.avatar.uploadSuccess') || 'Profile image uploaded successfully!');
      onImageUpdate?.(endpointUrl);

      globalThis.dispatchEvent(
        new CustomEvent('userImageUpdated', { detail: { ...updatedProfile, image: endpointUrl } })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('account.avatar.uploadFailed') || 'Failed to upload image. Please try again.'
      );

      // Revert preview on error
      if (currentImage && !currentImage.startsWith('data:')) {
        setPreview(currentImage);
      } else {
        setPreview(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelPreview = () => {
    if (currentImage && !currentImage.startsWith('data:')) {
      setPreview(currentImage);
    } else {
      setPreview(null);
    }
    setPendingFile(null);
    setPendingAvatarUrl(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false);
    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedProfile = await deleteAvatar();
      setPreview(null);
      onImageUpdate?.(null);

      globalThis.dispatchEvent(
        new CustomEvent('userImageUpdated', { detail: { ...updatedProfile, image: null } })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('account.avatar.deleteFailed') || 'Failed to delete image. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) handleFileSelect(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getBackgroundStyle = () => {
    if (backgroundColor === 'transparent') {
      return {
        background:
          'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.2))',
      };
    }
    return { background: backgroundColor };
  };

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
        {/* Preview Section */}
        <div className="flex shrink-0 basis-72 flex-col justify-center gap-4 md:justify-start">
          <div className="relative w-full max-w-[18rem]" style={{ aspectRatio: '1 / 1' }}>
            <div
              className={cn(
                'relative h-full w-full overflow-hidden rounded-3xl border border-white/15 shadow-xl transition-all duration-300',
                hasPendingSelection && 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-900',
                success &&
                  !isUploading &&
                  'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900'
              )}
              style={getBackgroundStyle()}
            >
              {preview ? (
                <img
                  key={preview}
                  src={preview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={() => {
                    // Image failed to load (404 or other error) - backend returns 404 if no avatar
                    setPreview(null);
                  }}
                  onLoad={() => {
                    // Image loaded successfully - no action needed
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Camera
                    className={cn(getIconColorForBackground(backgroundColor), 'h-[40%] w-[40%]')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Background Color Picker */}
          <div className="space-y-2">
            <label className="font-medium text-sm text-white">
              {t('account.avatar.backgroundColor') || 'Background Color'}
            </label>

            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => {
                const isSelected = backgroundColor === color.value;
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleBackgroundColorChange(color.value)}
                    disabled={isUploading}
                    className={cn(
                      'relative h-8 w-8 rounded-lg border-2 transition-all',
                      isSelected
                        ? 'scale-110 ring-2 ring-brand-400 ring-offset-1 ring-offset-slate-900'
                        : 'border-white/10 hover:scale-105 hover:border-brand-400/50',
                      isUploading && 'pointer-events-none opacity-50'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white/60 bg-linear-to-br from-brand-500 via-brand-600 to-sky-600 shadow-lg">
                          <Check className="text-white" size={12} strokeWidth={3} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  disabled={isUploading}
                  className={cn(
                    'relative flex aspect-square h-8 w-8 items-center justify-center rounded-lg border-2 border-dashed transition-all',
                    !PRESET_COLORS.some((c) => c.value === backgroundColor)
                      ? 'scale-110 border-white/10 ring-2 ring-brand-400 ring-offset-1 ring-offset-slate-900'
                      : 'border-white/30 hover:scale-105 hover:border-brand-400 hover:bg-brand-500/10',
                    isUploading && 'pointer-events-none opacity-50'
                  )}
                  style={{
                    backgroundColor: !PRESET_COLORS.some((c) => c.value === backgroundColor)
                      ? backgroundColor
                      : undefined,
                  }}
                  title={t('account.avatar.customColor') || 'Custom color'}
                >
                  <Plus size={16} className="text-white drop-shadow-sm" />
                  {!PRESET_COLORS.some((c) => c.value === backgroundColor) && (
                    <div className="absolute top-1 right-1">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white/60 bg-linear-to-br from-brand-500 via-brand-600 to-sky-600 shadow-lg">
                        <Check className="text-white" size={12} strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </button>

                <input
                  ref={colorInputRef}
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  disabled={isUploading}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Avatars Grid */}
        <div className="flex-1 space-y-4">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={VALID_IMAGE_TYPES.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-linear-to-br from-slate-950/80 via-slate-900/60 to-slate-900/30 p-4 shadow-inner">
            <div className="relative grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
              {PREDEFINED_AVATARS.map((avatarUrl, index) => {
                const isSelected = pendingAvatarUrl === avatarUrl;
                const isCurrent = currentImage === avatarUrl;
                const thumbnailUrl = PREDEFINED_AVATAR_THUMBNAILS[index];
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePredefinedAvatarSelect(avatarUrl)}
                    disabled={isUploading}
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-lg border-2 bg-linear-to-br from-brand-400 via-brand-500 to-sky-500 transition-all',
                      isSelected
                        ? 'ring-2 ring-brand-400 ring-offset-1 ring-offset-slate-900'
                        : isCurrent
                          ? 'border-emerald-400/50'
                          : 'border-white/20 hover:scale-105 hover:border-brand-400/50 hover:bg-linear-to-br hover:from-brand-300 hover:via-brand-400 hover:to-sky-400',
                      isUploading && 'pointer-events-none opacity-50'
                    )}
                  >
                    <img
                      src={thumbnailUrl || avatarUrl}
                      alt={`Avatar ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white/60 bg-linear-to-br from-brand-500 via-brand-600 to-sky-600 shadow-lg">
                          <Check className="text-white" size={12} strokeWidth={3} />
                        </div>
                      </div>
                    )}
                    {isCurrent && !isSelected && (
                      <div className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500">
                        <Check className="text-white" size={8} />
                      </div>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg border-2 border-white/30 border-dashed bg-slate-800/20 transition-all hover:scale-105 hover:border-brand-400 hover:bg-brand-500/10',
                  isUploading && 'pointer-events-none opacity-50'
                )}
                title={t('account.avatar.select') || 'Upload custom image'}
              >
                <Plus size={20} className="text-white drop-shadow-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        {hasPendingSelection ? (
          <>
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
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleConfirmUpload}
              disabled={isUploading}
              loading={isUploading}
              className="gap-2"
            >
              <Check size={16} />
              {t('account.avatar.confirm') || 'Confirm'}
            </Button>
          </>
        ) : (
          showDeleteButton && (
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
          )
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('account.avatar.delete') || 'Delete Profile Image'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('account.avatar.deleteConfirm') ||
                'Are you sure you want to delete your profile image? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUploading}>
              {t('common.cancel') || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isUploading}
            >
              {t('account.avatar.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Message */}
      {error && (
        <Alert tone="error" className="animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              {error.includes('Failed') && hasPendingSelection && (
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
