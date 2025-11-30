/**
 * Notification service - orchestrates notification delivery across channels
 * @module services/notification
 */

import { injectable } from 'tsyringe';
import {
  type NotificationRecord,
  NotificationRepository,
} from '../../infrastructure/repositories/notification.repository';
import type { UserId } from '../../schemas/user.schema';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';
import {
  type NotificationChannel,
  type NotificationPayload,
  PushNotificationChannel,
} from './channels';

export type { NotificationPayload } from './channels';

export interface SendNotificationOptions {
  /** If true, skip storing notification in DB (useful for test notifications) */
  skipPersist?: boolean;
  /** Channels to skip (e.g., ['push'] to skip push notifications) */
  skipChannels?: string[];
}

@injectable()
export class NotificationService {
  private readonly notificationRepository = inject(NotificationRepository);
  private readonly pushChannel = inject(PushNotificationChannel);

  /** All registered notification channels */
  private get channels(): NotificationChannel[] {
    return [
      this.pushChannel,
      // Future: this.emailChannel,
      // Future: this.smsChannel,
    ];
  }

  /**
   * Send a notification to a user. By default, this:
   * 1. Stores the notification in the database (for in-app display)
   * 2. Sends via all available channels (push, email, SMS, etc.)
   *
   * @param userId - The user to send the notification to
   * @param payload - The notification content
   * @param options - Optional flags to control behavior
   * @returns The stored notification record, or null if skipPersist was true
   */
  async sendToUser(
    userId: UserId,
    payload: NotificationPayload,
    options?: SendNotificationOptions
  ): Promise<NotificationRecord | null> {
    let storedNotification: NotificationRecord | null = null;

    // Store notification in database for in-app display
    if (!options?.skipPersist) {
      try {
        storedNotification = await this.notificationRepository.create({
          userId,
          type: payload.type || 'general',
          title: payload.title,
          body: payload.body,
          url: payload.url,
          data: payload.data,
        });
        logger.debug('Notification stored in DB', {
          userId,
          notificationId: storedNotification.id,
        });
      } catch (error) {
        logger.error('Failed to store notification in DB', { userId, error });
        // Continue to send via channels even if DB storage fails
      }
    }

    // Send via all available channels
    const skipChannels = new Set(options?.skipChannels || []);
    const channelPromises = this.channels
      .filter((channel) => channel.isAvailable() && !skipChannels.has(channel.name))
      .map((channel) =>
        channel.send(userId, payload).catch((error) => {
          logger.error(`Failed to send via ${channel.name} channel`, { userId, error });
          return { success: false, channelName: channel.name, error: String(error) };
        })
      );

    const results = await Promise.all(channelPromises);
    const successfulChannels = results.filter((r) => r.success).map((r) => r.channelName);
    const failedChannels = results.filter((r) => !r.success).map((r) => r.channelName);

    if (failedChannels.length > 0) {
      logger.warn('Some notification channels failed', {
        userId,
        successfulChannels,
        failedChannels,
      });
    }

    return storedNotification;
  }

  /** Get the VAPID public key for push subscription */
  getVapidPublicKey(): string {
    return this.pushChannel.getVapidPublicKey();
  }
}
