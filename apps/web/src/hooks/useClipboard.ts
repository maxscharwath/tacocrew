/**
 * Clipboard management hook
 * Handles copying to clipboard with visual feedback
 */

import { useState } from 'react';

interface UseClipboardOptions {
  timeout?: number;
}

interface UseClipboardState {
  copiedId: string | null;
  handleCopy: (id: string) => Promise<void>;
}

/**
 * Manage clipboard operations with visual feedback
 * @param options - Configuration options
 * @returns Copy handler and current copied ID
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardState {
  const { timeout = 2000 } = options;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), timeout);
    } catch {
      // Silently fail if clipboard is not available
    }
  };

  return {
    copiedId,
    handleCopy,
  };
}
