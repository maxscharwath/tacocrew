import { Camera, Check, Palette, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
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
import { imageUrlToFile, PREDEFINED_AVATARS } from '@/lib/avatars';
import { ENV } from '@/lib/env';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const SUCCESS_MESSAGE_DURATION = 3000;

const PRESET_COLORS = [
  { name: 'Transparent', value: 'transparent' },
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
  currentImage?: string | null;
  onImageUpdate?: (image: string | null) => void;
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
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'text-slate-700' : 'text-slate-300';
}

/**
 * Get checkerboard pattern for transparent background
 */
function getTransparentPattern() {
  return {
    backgroundImage:
      'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
  };
}

export function ImageUploader({ currentImage, onImageUpdate }: ImageUploaderProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize preview with currentImage immediately - resolve URL if needed
  const getInitialPreview = (): string | null => {
    if (currentImage && typeof currentImage === 'string' && currentImage.trim()) {
      // If it's a relative URL, resolve it to absolute using API base URL or current origin
      if (currentImage.startsWith('/')) {
        const baseUrl =
          ENV.apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
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
  const [showColorPicker, setShowColorPicker] = useState(false);
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
            ENV.apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
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
      const updatedProfile = await uploadAvatar(
        fileToUpload,
        backgroundColor !== 'transparent' ? backgroundColor : null
      );

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm text-white">
                {t('account.avatar.backgroundColor') || 'Background Color'}
              </label>
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-400 text-xs transition-colors hover:text-white"
              >
                <Palette size={14} />
                {showColorPicker ? 'Hide' : 'Custom'}
              </button>
            </div>

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
                      color.value === 'transparent' && 'border-white/20 border-dashed',
                      isSelected
                        ? 'scale-110 ring-2 ring-brand-400 ring-offset-1 ring-offset-slate-900'
                        : 'border-white/10 hover:scale-105 hover:border-brand-400/50',
                      isUploading && 'pointer-events-none opacity-50'
                    )}
                    style={
                      color.value === 'transparent'
                        ? getTransparentPattern()
                        : { backgroundColor: color.value }
                    }
                    title={color.name}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="text-white drop-shadow-lg" size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {showColorPicker && (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/40 p-2">
                <input
                  type="color"
                  value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  disabled={isUploading}
                  className="h-8 w-16 cursor-pointer rounded border border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={backgroundColor === 'transparent' ? '' : backgroundColor}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      handleBackgroundColorChange(value || 'transparent');
                    }
                  }}
                  placeholder="#000000"
                  disabled={isUploading}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
                />
              </div>
            )}
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

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
            {PREDEFINED_AVATARS.map((avatarUrl, index) => {
              const isSelected = pendingAvatarUrl === avatarUrl;
              const isCurrent = currentImage === avatarUrl;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePredefinedAvatarSelect(avatarUrl)}
                  disabled={isUploading}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                    isSelected
                      ? 'border-brand-400 ring-2 ring-brand-400/50 ring-offset-1 ring-offset-slate-900'
                      : isCurrent
                        ? 'border-emerald-400/50'
                        : 'border-white/10 hover:border-brand-400/50',
                    isUploading && 'pointer-events-none opacity-50'
                  )}
                >
                  <img
                    src={avatarUrl}
                    alt={`Avatar ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-brand-500/30">
                      <Check className="text-white" size={16} />
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
                'flex aspect-square items-center justify-center rounded-lg border-2 border-white/20 border-dashed bg-slate-900/40 transition-all hover:border-brand-400/50 hover:bg-slate-900/60',
                isUploading && 'pointer-events-none opacity-50'
              )}
              title={t('account.avatar.select') || 'Upload custom image'}
            >
              <Plus size={20} className="text-slate-400" />
            </button>
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
              variant="primary"
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
