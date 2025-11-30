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
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
  
  // Determine MIME type from URL or Content-Type header, with fallbacks
  let mimeType = blob.type;
  
  // If blob type is missing or invalid, try to infer from URL
  if (!mimeType || mimeType === 'application/octet-stream' || mimeType.includes('undefined')) {
    if (imageUrl.includes('.webp') || imageUrl.includes('format=webp')) {
      mimeType = 'image/webp';
    } else if (imageUrl.includes('.png')) {
      mimeType = 'image/png';
    } else if (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (imageUrl.includes('.gif')) {
      mimeType = 'image/gif';
    } else {
      // Default fallback - PREDEFINED_AVATARS are webp
      mimeType = 'image/webp';
    }
  }
  
  return new File([blob], filename, { type: mimeType });
}
