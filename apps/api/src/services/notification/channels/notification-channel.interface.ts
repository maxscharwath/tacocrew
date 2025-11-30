/**
 * Notification channel interface
 * All notification delivery channels must implement this interface
 * @module services/notification/channels
 */

import type { UserId } from '../../../schemas/user.schema';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  url?: string;
  /** Notification type for categorization (e.g., 'payment_reminder', 'payment_update') */
  type?: string;
}

export interface NotificationChannelResult {
  success: boolean;
  channelName: string;
  error?: string;
}

/**
 * Interface for notification delivery channels
 * Implement this interface to add new notification delivery methods (push, email, SMS, etc.)
 */
export interface NotificationChannel {
  /** Unique name for this channel */
  readonly name: string;

  /**
   * Check if this channel is available/configured
   */
  isAvailable(): boolean;

  /**
   * Send a notification to a user via this channel
   * @param userId - The user to send the notification to
   * @param payload - The notification content
   * @returns Result indicating success or failure
   */
  send(userId: UserId, payload: NotificationPayload): Promise<NotificationChannelResult>;
}
