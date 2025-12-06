/**
 * Notification service - orchestrates notification delivery across channels
 * @module services/notification
 */

import { injectable } from 'tsyringe';
import {
  type NotificationRecord,
  NotificationRepository,
} from '@/infrastructure/repositories/notification.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import type { UserId } from '@/schemas/user.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import {
  type NotificationChannel,
  type NotificationPayload,
  PushNotificationChannel,
} from '@/services/notification/channels';

export type { NotificationPayload } from '@/services/notification/channels';

export interface SendNotificationOptions {
  /** If true, skip storing notification in DB (useful for test notifications) */
  skipPersist?: boolean;
  /** Channels to skip (e.g., ['push'] to skip push notifications) */
  skipChannels?: string[];
}

export interface NotificationPayloadWithTranslations {
  /** Translation function for title - can be a function (lng: string) => string or a curried t() call */
  title: ((lng: string) => string) | string;
  /** Translation function for body - can be a function (lng: string) => string or a curried t() call */
  body: ((lng: string) => string) | string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  url?: string;
  type?: string;
}

@injectable()
export class NotificationService {
  private readonly notificationRepository = inject(NotificationRepository);
  private readonly userRepository = inject(UserRepository);
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
   * Resolves a translation value (function or string) to a string
   */
  private resolveTranslation(value: ((lng: string) => string) | string, language: string): string {
    return typeof value === 'function' ? value(language) : value;
  }

  /**
   * Converts a payload with potential translations to a final translated payload
   */
  private async resolvePayload(
    userId: UserId,
    payload: NotificationPayload | NotificationPayloadWithTranslations
  ): Promise<NotificationPayload> {
    const hasTranslations =
      typeof payload.title === 'function' || typeof payload.body === 'function';

    if (!hasTranslations) {
      return payload as NotificationPayload;
    }

    try {
      const userLanguage = await this.userRepository.getUserLanguage(userId);
      return this.buildPayload(payload, userLanguage);
    } catch (error) {
      logger.error('Failed to get user language for notification', { userId, error });
      return this.buildPayload(payload, 'en');
    }
  }

  /**
   * Builds a NotificationPayload from a payload with potential translations
   */
  private buildPayload(
    payload: NotificationPayload | NotificationPayloadWithTranslations,
    language: string
  ): NotificationPayload {
    return {
      title: this.resolveTranslation(payload.title, language),
      body: this.resolveTranslation(payload.body, language),
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: payload.data,
      url: payload.url,
      type: payload.type,
    };
  }

  /**
   * Send a notification to a user.
   * Automatically handles localization if translation functions are provided.
   * By default, this:
   * 1. Stores the notification in the database (for in-app display)
   * 2. Sends via all available channels (push, email, SMS, etc.)
   *
   * @param userId - The user to send the notification to
   * @param payload - The notification content (can be already translated strings or translation functions)
   * @param options - Optional flags to control behavior
   * @returns The stored notification record, or null if skipPersist was true
   */
  async sendToUser(
    userId: UserId,
    payload: NotificationPayload | NotificationPayloadWithTranslations,
    options?: SendNotificationOptions
  ): Promise<NotificationRecord | null> {
    const finalPayload = await this.resolvePayload(userId, payload);
    let storedNotification: NotificationRecord | null = null;

    // Store notification in database for in-app display
    if (!options?.skipPersist) {
      try {
        storedNotification = await this.notificationRepository.create({
          userId,
          type: finalPayload.type || 'general',
          title: finalPayload.title,
          body: finalPayload.body,
          url: finalPayload.url,
          data: finalPayload.data,
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
        channel.send(userId, finalPayload).catch((error) => {
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
