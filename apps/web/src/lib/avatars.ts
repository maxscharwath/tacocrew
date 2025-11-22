/**
 * Predefined avatar images
 * All avatars are imported statically for better performance
 */

import avatar01 from '@/avatars/avatar-01.png';
import avatar02 from '@/avatars/avatar-02.png';
import avatar03 from '@/avatars/avatar-03.png';
import avatar04 from '@/avatars/avatar-04.png';
import avatar05 from '@/avatars/avatar-05.png';
import avatar06 from '@/avatars/avatar-06.png';
import avatar07 from '@/avatars/avatar-07.png';
import avatar08 from '@/avatars/avatar-08.png';
import avatar09 from '@/avatars/avatar-09.png';
import avatar10 from '@/avatars/avatar-10.png';
import avatar11 from '@/avatars/avatar-11.png';
import avatar12 from '@/avatars/avatar-12.png';

export const PREDEFINED_AVATARS = [
  avatar01,
  avatar02,
  avatar03,
  avatar04,
  avatar05,
  avatar06,
  avatar07,
  avatar08,
  avatar09,
  avatar10,
  avatar11,
  avatar12,
] as const;

/**
 * Convert an image URL to a File object for upload
 */
export async function imageUrlToFile(imageUrl: string, filename: string = 'avatar.png'): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

