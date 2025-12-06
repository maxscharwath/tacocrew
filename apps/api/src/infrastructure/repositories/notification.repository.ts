/**
 * Notification repository
 * @module infrastructure/repositories/notification
 */

import { injectable } from 'tsyringe';
import { Prisma } from '@/generated/client';
import type { UserId } from '@/schemas/user.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { createPage, cursorArgs, normalizeLimit, type Page } from '@/infrastructure/database/pagination';
import { PrismaService } from '@/infrastructure/database/prisma.service';

export interface CreateNotificationData {
  userId: UserId;
  type: string;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  readAt: Date | null;
  archived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
}

@injectable()
export class NotificationRepository {
  private readonly prisma = inject(PrismaService);

  async create(data: CreateNotificationData): Promise<NotificationRecord> {
    try {
      const notification = await this.prisma.client.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          url: data.url || null,
          data: data.data ? (data.data as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      });
      logger.debug('Notification created', { userId: data.userId, type: data.type });
      return this.mapToRecord(notification);
    } catch (error) {
      logger.error('Failed to create notification', { userId: data.userId, error });
      throw error;
    }
  }

  async findByUserId(
    userId: UserId,
    options?: { limit?: number; cursor?: string; archived?: boolean }
  ): Promise<Page<NotificationRecord>> {
    try {
      const where = { userId, archived: options?.archived ?? false };
      const limit = normalizeLimit(options?.limit);

      // Run count and findMany in parallel
      const [total, items] = await Promise.all([
        this.prisma.client.notification.count({ where }),
        this.prisma.client.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit + 1, // Fetch one extra to check hasMore
          ...cursorArgs(options?.cursor),
        }),
      ]);

      const page = createPage(items.map(this.mapToRecord), total, limit);

      return page;
    } catch (error) {
      logger.error('Failed to find notifications', { userId, error });
      return { items: [], total: 0, nextCursor: null, hasMore: false };
    }
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    try {
      const notification = await this.prisma.client.notification.findUnique({
        where: { id },
      });
      return notification ? this.mapToRecord(notification) : null;
    } catch (error) {
      logger.error('Failed to find notification by id', { id, error });
      return null;
    }
  }

  async getUnreadCount(userId: UserId): Promise<number> {
    try {
      return await this.prisma.client.notification.count({
        where: { userId, read: false, archived: false },
      });
    } catch (error) {
      logger.error('Failed to get unread notification count', { userId, error });
      return 0;
    }
  }

  async markAsRead(id: string, userId: UserId): Promise<NotificationRecord | null> {
    try {
      const notification = await this.prisma.client.notification.update({
        where: { id, userId }, // Ensure user owns the notification
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      logger.debug('Notification marked as read', { id, userId });
      return this.mapToRecord(notification);
    } catch (error) {
      logger.error('Failed to mark notification as read', { id, userId, error });
      return null;
    }
  }

  async markAllAsRead(userId: UserId): Promise<number> {
    try {
      const result = await this.prisma.client.notification.updateMany({
        where: { userId, read: false, archived: false },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      logger.debug('All notifications marked as read', { userId, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { userId, error });
      return 0;
    }
  }

  async archive(id: string, userId: UserId): Promise<NotificationRecord | null> {
    try {
      const notification = await this.prisma.client.notification.update({
        where: { id, userId },
        data: {
          archived: true,
          archivedAt: new Date(),
          read: true, // Also mark as read when archiving
          readAt: new Date(),
        },
      });
      logger.debug('Notification archived', { id, userId });
      return this.mapToRecord(notification);
    } catch (error) {
      logger.error('Failed to archive notification', { id, userId, error });
      return null;
    }
  }

  async archiveAll(userId: UserId): Promise<number> {
    try {
      const result = await this.prisma.client.notification.updateMany({
        where: { userId, archived: false },
        data: {
          archived: true,
          archivedAt: new Date(),
          read: true,
          readAt: new Date(),
        },
      });
      logger.debug('All notifications archived', { userId, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to archive all notifications', { userId, error });
      return 0;
    }
  }

  async deleteOld(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.prisma.client.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          read: true, // Only delete read notifications
        },
      });
      logger.info('Old notifications deleted', { count: result.count, olderThanDays });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete old notifications', { olderThanDays, error });
      return 0;
    }
  }

  async deleteByUserId(userId: UserId): Promise<number> {
    try {
      const result = await this.prisma.client.notification.deleteMany({
        where: { userId },
      });
      logger.debug('Notifications deleted for user', { userId, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete notifications for user', { userId, error });
      return 0;
    }
  }

  private mapToRecord(notification: {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    url: string | null;
    data: unknown;
    read: boolean;
    readAt: Date | null;
    archived: boolean;
    archivedAt: Date | null;
    createdAt: Date;
  }): NotificationRecord {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      data: notification.data as Record<string, unknown> | null,
      read: notification.read,
      readAt: notification.readAt,
      archived: notification.archived,
      archivedAt: notification.archivedAt,
      createdAt: notification.createdAt,
    };
  }
}
