/**
 * Push Notification Client
 * Wrapper around the Web Push API for easier subscription management
 */

import {
  getPushPublicKey,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '@/lib/api/push-notifications';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
}

export class PushNotificationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PushNotificationError';
  }
}

export class PushNotificationClient {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private publicKey: string | null = null;

  /**
   * Check if push notifications are supported in this browser
   */
  static isSupported(): boolean {
    return (
      'serviceWorker' in navigator && 'PushManager' in globalThis && 'Notification' in globalThis
    );
  }

  /**
   * Check if notification permission is granted
   */
  static getPermission(): NotificationPermission {
    if (!('Notification' in globalThis)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in globalThis)) {
      throw new PushNotificationError('Notifications are not supported');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new PushNotificationError(
        'Notification permission was previously denied. Please enable it in your browser settings.',
        'PERMISSION_DENIED'
      );
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new PushNotificationError('Notification permission was denied', 'PERMISSION_DENIED');
    }

    return permission;
  }

  /**
   * Initialize the client by registering service worker and getting public key
   */
  async initialize(): Promise<void> {
    if (!PushNotificationClient.isSupported()) {
      throw new PushNotificationError('Push notifications are not supported');
    }

    // Get service worker registration (auto-registered by vite-plugin-pwa)
    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
    } catch (error) {
      throw new PushNotificationError(
        'Failed to register service worker',
        'SERVICE_WORKER_ERROR',
        error
      );
    }

    // Get VAPID public key from server
    try {
      const response = await getPushPublicKey();
      this.publicKey = response.publicKey;
      if (!this.publicKey) {
        throw new PushNotificationError('VAPID public key not available');
      }
    } catch (error) {
      throw new PushNotificationError('Failed to get VAPID public key', 'VAPID_KEY_ERROR', error);
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      await this.initialize();
    }

    try {
      this.subscription = await this.serviceWorkerRegistration!.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      throw new PushNotificationError(
        'Failed to get subscription',
        'GET_SUBSCRIPTION_ERROR',
        error
      );
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscriptionData> {
    if (!this.serviceWorkerRegistration || !this.publicKey) {
      await this.initialize();
    }

    // Request permission first
    await PushNotificationClient.requestPermission();

    // Check if already subscribed
    const existingSubscription = await this.getSubscription();
    if (existingSubscription) {
      return this.serializeSubscription(existingSubscription);
    }

    try {
      // Convert VAPID key from base64url to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(this.publicKey!);

      // Subscribe to push notifications
      this.subscription = await this.serviceWorkerRegistration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Serialize subscription
      const subscriptionData = this.serializeSubscription(this.subscription);

      // Send subscription to server
      try {
        await subscribeToPushNotifications({
          ...subscriptionData,
          userAgent: navigator.userAgent,
        });
      } catch (error) {
        // If server registration fails, unsubscribe from push service
        await this.subscription.unsubscribe();
        throw new PushNotificationError(
          'Failed to register subscription with server',
          'SERVER_REGISTRATION_ERROR',
          error
        );
      }

      return subscriptionData;
    } catch (error) {
      if (error instanceof PushNotificationError) {
        throw error;
      }
      throw new PushNotificationError(
        'Failed to subscribe to push notifications',
        'SUBSCRIBE_ERROR',
        error
      );
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    const subscription = await this.getSubscription();
    if (!subscription) {
      return; // Already unsubscribed
    }

    try {
      // Unsubscribe from push service
      await subscription.unsubscribe();

      // Remove subscription from server
      try {
        await unsubscribeFromPushNotifications(subscription.endpoint);
      } catch (error) {
        // Log but don't throw - subscription is already removed from browser
        console.warn('Failed to remove subscription from server:', error);
      }

      this.subscription = null;
    } catch (error) {
      throw new PushNotificationError(
        'Failed to unsubscribe from push notifications',
        'UNSUBSCRIBE_ERROR',
        error
      );
    }
  }

  /**
   * Check if currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      return subscription !== null;
    } catch {
      return false;
    }
  }

  /**
   * Serialize PushSubscription to send to server
   */
  private serializeSubscription(subscription: PushSubscription): PushSubscriptionData {
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');

    if (!p256dhKey || !authKey) {
      throw new PushNotificationError('Invalid subscription keys');
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(p256dhKey),
        auth: this.arrayBufferToBase64(authKey),
      },
    };
  }

  /**
   * Convert base64url to Uint8Array
   */
  private urlBase64ToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
    const binary = atob(base64url.replace(/-/g, '+').replace(/_/g, '/'));
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCodePoint(bytes[i]);
    }
    return globalThis.btoa(binary);
  }
}

// Singleton instance
let clientInstance: PushNotificationClient | null = null;

/**
 * Get or create the push notification client instance
 */
export function getPushNotificationClient(): PushNotificationClient {
  clientInstance ??= new PushNotificationClient();
  return clientInstance;
}
