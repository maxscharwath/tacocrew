/**
 * Push notification channel implementation
 * Sends browser push notifications via Web Push API
 * @module services/notification/channels
 */

import { injectable } from 'tsyringe';
import webpush from 'web-push';
import { PushSubscriptionRepository } from '@/infrastructure/repositories/push-subscription.repository';
import type { UserId } from '@/schemas/user.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';
import type {
  NotificationChannel,
  NotificationChannelResult,
  NotificationPayload,
} from '@/services/notification/channels/notification-channel.interface';

@injectable()
export class PushNotificationChannel implements NotificationChannel {
  readonly name = 'push';

  private readonly pushSubscriptionRepository = inject(PushSubscriptionRepository);
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;
  private readonly vapidSubject: string;
  private readonly initialized: boolean;

  constructor() {
    this.vapidPublicKey = process.env['VAPID_PUBLIC_KEY'] || '';
    this.vapidPrivateKey = process.env['VAPID_PRIVATE_KEY'] || '';
    this.vapidSubject =
      process.env['VAPID_SUBJECT'] || process.env['FRONTEND_URL'] || 'mailto:admin@example.com';

    if (this.vapidPublicKey && this.vapidPrivateKey) {
      webpush.setVapidDetails(this.vapidSubject, this.vapidPublicKey, this.vapidPrivateKey);
      this.initialized = true;
    } else {
      logger.warn('VAPID keys not configured. Push notifications will not work.');
      this.initialized = false;
    }
  }

  isAvailable(): boolean {
    return this.initialized;
  }

  async send(userId: UserId, payload: NotificationPayload): Promise<NotificationChannelResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        channelName: this.name,
        error: 'VAPID keys not configured',
      };
    }

    const subscriptions = await this.pushSubscriptionRepository.findByUserId(userId);
    if (subscriptions.length === 0) {
      logger.debug('No push subscriptions found for user', { userId });
      return {
        success: true, // Not a failure - user just doesn't have push enabled
        channelName: this.name,
      };
    }

    // Generate a unique tag for each notification to allow multiple notifications
    const uniqueTag = payload.tag ? `${payload.tag}-${randomUUID()}` : randomUUID();

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: uniqueTag,
      data: {
        ...payload.data,
        url: payload.url,
      },
    });

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        this.sendToSubscription(subscription, notificationPayload, userId)
      )
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.length - successCount;

    if (failCount > 0) {
      logger.debug('Push notifications sent with some failures', {
        userId,
        successCount,
        failCount,
      });
    }

    return {
      success: successCount > 0,
      channelName: this.name,
      error: failCount > 0 ? `${failCount} of ${results.length} subscriptions failed` : undefined,
    };
  }

  private async sendToSubscription(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: string,
    userId: UserId
  ): Promise<void> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload
      );
      logger.debug('Push notification sent', { userId, endpoint: subscription.endpoint });
    } catch (error) {
      logger.error('Failed to send push notification', {
        userId,
        endpoint: subscription.endpoint,
        error,
      });

      // Remove invalid subscriptions (410 = Gone, 404 = Not Found)
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          logger.info('Removing invalid push subscription', { endpoint: subscription.endpoint });
          await this.pushSubscriptionRepository.delete(subscription.endpoint).catch(() => {
            // Ignore deletion errors
          });
        }
      }

      throw error;
    }
  }

  /** Get the VAPID public key for client-side subscription */
  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }
}
