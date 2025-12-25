/**
 * User display utilities
 * Helpers for displaying user information consistently
 */

/**
 * Get display name from profile
 * Falls back to username, then generic 'User'
 */
export function getDisplayName(
  name: string | null | undefined,
  username: string | null | undefined
): string {
  return name || username || 'User';
}

/**
 * Get user initials from display name
 * Returns first 2 characters, uppercase
 */
export function getUserInitials(displayName: string): string {
  return displayName.slice(0, 2).toUpperCase();
}

/**
 * Check if user has custom image
 */
export function hasUserImage(image: string | null | undefined): boolean {
  return !!image;
}

/**
 * Format username for display
 * Adds @ prefix if provided
 */
export function formatUsername(username: string | null | undefined): string | null {
  return username ? `@${username}` : null;
}
