/**
 * Predefined avatar images
 * All avatars are imported statically for better performance
 * Using Vite's glob import to automatically load all avatars
 */

export const PREDEFINED_AVATARS = Object.values(
  import.meta.glob<string>('@/avatars/avatar-*.png', {
    eager: true,
    query: '?format=webp',
    import: 'default',
  })
);

/**
 * Convert an image URL to a File object for upload
 */
export async function imageUrlToFile(
  imageUrl: string,
  filename: string = 'avatar.png'
): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}
