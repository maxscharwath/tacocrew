import { useEffect, useRef, useState } from 'react';
import {
  getPushNotificationClient,
  PushNotificationClient,
  PushNotificationError,
} from '@/lib/push-notifications';

export interface UsePushNotificationsReturn {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Whether the user is currently subscribed */
  isSubscribed: boolean;
  /** Whether a subscription operation is in progress */
  isSubscribing: boolean;
  /** Current permission status */
  permission: NotificationPermission | null;
  /** Error message if any operation failed */
  error: string | null;
  /** Error code for programmatic handling */
  errorCode: string | null;
  /** Subscribe to push notifications */
  subscribe: () => Promise<void>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
  /** Refresh subscription status */
  refresh: () => Promise<void>;
}

/**
 * React hook for managing push notifications
 *
 * @example
 * ```tsx
 * const { isSupported, isSubscribed, subscribe, unsubscribe, error } = usePushNotifications();
 *
 * if (!isSupported) {
 *   return <div>Push notifications are not supported</div>;
 * }
 *
 * return (
 *   <button onClick={isSubscribed ? unsubscribe : subscribe}>
 *     {isSubscribed ? 'Disable' : 'Enable'} Notifications
 *   </button>
 * );
 * ```
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState({
    isSupported: false,
    isSubscribed: false,
    isSubscribing: false,
    permission: null as NotificationPermission | null,
    error: null as string | null,
    errorCode: null as string | null,
  });

  const clientRef = useRef<PushNotificationClient | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize client and check support
  useEffect(() => {
    const isSupported = PushNotificationClient.isSupported();
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) {
      return;
    }

    // Initialize client
    clientRef.current = getPushNotificationClient();

    // Check permission status
    const permission = PushNotificationClient.getPermission();
    setState((prev) => ({ ...prev, permission }));

    // Check subscription status
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!clientRef.current) {
      return;
    }

    try {
      const isSubscribed = await clientRef.current.isSubscribed();
      setState((prev) => ({
        ...prev,
        isSubscribed,
        error: null,
        errorCode: null,
      }));
    } catch (error) {
      // Silently fail - subscription check shouldn't block the UI
      console.warn('Failed to check subscription status:', error);
    }
  };

  const subscribe = async () => {
    if (!clientRef.current) {
      setState((prev) => ({
        ...prev,
        error: 'Push notifications are not supported',
        errorCode: 'NOT_SUPPORTED',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isSubscribing: true,
      error: null,
      errorCode: null,
    }));

    try {
      // Initialize if not already done
      if (!isInitializedRef.current) {
        await clientRef.current.initialize();
        isInitializedRef.current = true;
      }

      // Subscribe
      await clientRef.current.subscribe();

      // Update permission status
      const permission = PushNotificationClient.getPermission();
      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isSubscribing: false,
        permission,
        error: null,
        errorCode: null,
      }));
    } catch (error) {
      const pushError = error instanceof PushNotificationError ? error : null;
      const errorMessage =
        pushError?.message || error instanceof Error ? error.message : 'Failed to subscribe';
      const errorCode = pushError?.code || 'UNKNOWN_ERROR';

      // Update permission status in case it changed
      const permission = PushNotificationClient.getPermission();

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isSubscribing: false,
        permission,
        error: errorMessage,
        errorCode,
      }));
    }
  };

  const unsubscribe = async () => {
    if (!clientRef.current) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isSubscribing: true,
      error: null,
      errorCode: null,
    }));

    try {
      await clientRef.current.unsubscribe();

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isSubscribing: false,
        error: null,
        errorCode: null,
      }));
    } catch (error) {
      const pushError = error instanceof PushNotificationError ? error : null;
      const errorMessage =
        pushError?.message || error instanceof Error ? error.message : 'Failed to unsubscribe';
      const errorCode = pushError?.code || 'UNKNOWN_ERROR';

      setState((prev) => ({
        ...prev,
        isSubscribing: false,
        error: errorMessage,
        errorCode,
      }));
    }
  };

  const refresh = async () => {
    await checkSubscriptionStatus();
    const permission = PushNotificationClient.getPermission();
    setState((prev) => ({ ...prev, permission }));
  };

  return {
    ...state,
    subscribe,
    unsubscribe,
    refresh,
  };
}
