/**
 * Utility functions for user-related operations
 */

/**
 * Extract user initials from a name
 */
export function getUserInitials(name: string | null): string {
  return (name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get avatar size in pixels based on size prop
 */
export function getAvatarSizePixels(size: 'sm' | 'md'): number {
  return size === 'md' ? 32 : 24;
}

/**
 * Get avatar CSS class based on size prop
 */
export function getAvatarSizeClass(size: 'sm' | 'md', variant: 'badge' | 'stacked'): string {
  if (variant === 'badge') {
    return size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  }
  return size === 'md' ? 'h-8 w-8' : 'h-6 w-6';
}

/**
 * Get offset class for stacked avatars
 */
export function getStackedOffsetClass(size: 'sm' | 'md'): string {
  return size === 'md' ? '-ml-4' : '-ml-3';
}
