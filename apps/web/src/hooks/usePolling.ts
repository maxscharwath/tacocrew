import { useEffect, useRef } from 'react';

interface UsePollingOptions {
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  interval?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
  /** Only poll when document is visible (default: true) */
  onlyWhenVisible?: boolean;
  /** Interval when document is hidden (default: disabled) */
  hiddenInterval?: number;
}

/**
 * Hook for smart polling with visibility detection
 *
 * Features:
 * - Pauses when tab is hidden (saves resources)
 * - Resumes immediately when tab becomes visible
 * - Optional slower polling when hidden
 *
 * @example
 * ```tsx
 * usePolling(fetchNotifications, {
 *   interval: 30000, // 30 seconds
 *   onlyWhenVisible: true,
 * });
 * ```
 */
export function usePolling(callback: () => void | Promise<void>, options: UsePollingOptions = {}) {
  const { interval = 30000, enabled = true, onlyWhenVisible = true, hiddenInterval } = options;

  const savedCallback = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      savedCallback.current();
    };

    const startPolling = (ms: number) => {
      stopPolling();
      intervalRef.current = setInterval(tick, ms);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (onlyWhenVisible) {
          stopPolling();
          // Optionally poll slower when hidden
          if (hiddenInterval) {
            startPolling(hiddenInterval);
          }
        }
      } else {
        // Tab became visible - fetch immediately and restart polling
        tick();
        startPolling(interval);
      }
    };

    // Initial poll
    tick();

    // Start polling if visible (or if we don't care about visibility)
    if (!onlyWhenVisible || !document.hidden) {
      startPolling(interval);
    } else if (hiddenInterval) {
      startPolling(hiddenInterval);
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, onlyWhenVisible, hiddenInterval]);
}
