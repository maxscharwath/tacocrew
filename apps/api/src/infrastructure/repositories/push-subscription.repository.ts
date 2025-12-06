/**
 * Push subscription repository
 * @module infrastructure/repositories/push-subscription
 */

import { injectable } from 'tsyringe';
import type { UserId } from '@/schemas/user.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { PrismaService } from '@/infrastructure/database/prisma.service';

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

@injectable()
export class PushSubscriptionRepository {
  private readonly prisma = inject(PrismaService);

  async create(userId: UserId, data: PushSubscriptionData): Promise<void> {
    try {
      await this.prisma.client.pushSubscription.upsert({
        where: { endpoint: data.endpoint },
        create: {
          userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          userAgent: data.userAgent || null,
        },
        update: {
          userId,
          p256dh: data.p256dh,
          auth: data.auth,
          userAgent: data.userAgent || null,
          updatedAt: new Date(),
        },
      });
      logger.debug('Push subscription created/updated', { userId, endpoint: data.endpoint });
    } catch (error) {
      logger.error('Failed to create push subscription', { userId, error });
      throw error;
    }
  }

  async findByUserId(userId: UserId): Promise<PushSubscriptionData[]> {
    try {
      const subscriptions = await this.prisma.client.pushSubscription.findMany({
        where: { userId },
        select: {
          endpoint: true,
          p256dh: true,
          auth: true,
          userAgent: true,
        },
      });
      return subscriptions.map((sub) => ({
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
        userAgent: sub.userAgent ?? undefined,
      }));
    } catch (error) {
      logger.error('Failed to find push subscriptions', { userId, error });
      return [];
    }
  }

  async findAllByUserId(userId: UserId): Promise<
    Array<{
      id: string;
      endpoint: string;
      userAgent: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    try {
      const subscriptions = await this.prisma.client.pushSubscription.findMany({
        where: { userId },
        select: {
          id: true,
          endpoint: true,
          userAgent: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return subscriptions;
    } catch (error) {
      logger.error('Failed to find push subscriptions', { userId, error });
      return [];
    }
  }

  async delete(endpoint: string): Promise<void> {
    try {
      await this.prisma.client.pushSubscription.delete({
        where: { endpoint },
      });
      logger.debug('Push subscription deleted', { endpoint });
    } catch (error) {
      logger.error('Failed to delete push subscription', { endpoint, error });
      throw error;
    }
  }

  async deleteByUserId(userId: UserId): Promise<void> {
    try {
      await this.prisma.client.pushSubscription.deleteMany({
        where: { userId },
      });
      logger.debug('Push subscriptions deleted for user', { userId });
    } catch (error) {
      logger.error('Failed to delete push subscriptions', { userId, error });
      throw error;
    }
  }
}
