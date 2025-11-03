/**
 * User order repository (infrastructure layer)
 * @module infrastructure/repositories/user-order
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/database/prisma.service';
import type { GroupOrderId } from '@/domain/schemas/group-order.schema';
import type { UserId } from '@/domain/schemas/user.schema';
import { createUserOrderFromDb, type UserOrder } from '@/domain/schemas/user-order.schema';
import { UserOrderItems, UserOrderStatus } from '@/types';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

/**
 * User order repository
 */
@injectable()
export class UserOrderRepository {
  private readonly prisma = inject(PrismaService);

  async findByGroupAndUser(groupOrderId: GroupOrderId, userId: UserId): Promise<UserOrder | null> {
    try {
      const dbUserOrder = await this.prisma.client.userOrder.findUnique({
        where: {
          groupOrderId_userId: {
            groupOrderId,
            userId,
          },
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      return dbUserOrder ? createUserOrderFromDb(dbUserOrder) : null;
    } catch (error) {
      logger.error('Failed to get user order', { groupOrderId, userId, error });
      return null;
    }
  }

  async findByGroup(groupOrderId: GroupOrderId): Promise<UserOrder[]> {
    try {
      const dbUserOrders = await this.prisma.client.userOrder.findMany({
        where: { groupOrderId },
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      return dbUserOrders.map((uo) => createUserOrderFromDb(uo));
    } catch (error) {
      logger.error('Failed to get user orders', { groupOrderId, error });
      return [];
    }
  }

  async upsert(data: {
    groupOrderId: GroupOrderId;
    userId: UserId;
    items: UserOrderItems;
    status?: UserOrderStatus;
  }): Promise<UserOrder> {
    try {
      const dbUserOrder = await this.prisma.client.userOrder.upsert({
        where: {
          groupOrderId_userId: {
            groupOrderId: data.groupOrderId,
            userId: data.userId,
          },
        },
        create: {
          groupOrderId: data.groupOrderId,
          userId: data.userId,
          items: JSON.stringify(data.items),
          status: data.status || UserOrderStatus.DRAFT,
        },
        update: {
          items: JSON.stringify(data.items),
          status: data.status || UserOrderStatus.DRAFT,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      logger.debug('User order upserted', { groupOrderId: data.groupOrderId, userId: data.userId });
      return createUserOrderFromDb(dbUserOrder);
    } catch (error) {
      logger.error('Failed to upsert user order', {
        groupOrderId: data.groupOrderId,
        userId: data.userId,
        error,
      });
      throw error;
    }
  }

  async updateStatus(
    groupOrderId: GroupOrderId,
    userId: UserId,
    status: UserOrderStatus
  ): Promise<UserOrder> {
    try {
      const dbUserOrder = await this.prisma.client.userOrder.update({
        where: {
          groupOrderId_userId: {
            groupOrderId,
            userId,
          },
        },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      logger.debug('User order status updated', { groupOrderId, userId, status });
      return createUserOrderFromDb(dbUserOrder);
    } catch (error) {
      logger.error('Failed to update user order status', { groupOrderId, userId, error });
      throw error;
    }
  }

  async delete(groupOrderId: GroupOrderId, userId: UserId): Promise<void> {
    try {
      await this.prisma.client.userOrder.delete({
        where: {
          groupOrderId_userId: {
            groupOrderId,
            userId,
          },
        },
      });
      logger.info('User order deleted', { groupOrderId, userId });
    } catch (error) {
      logger.error('Failed to delete user order', { groupOrderId, userId, error });
      throw error;
    }
  }

  async exists(groupOrderId: GroupOrderId, userId: UserId): Promise<boolean> {
    try {
      const count = await this.prisma.client.userOrder.count({
        where: {
          groupOrderId,
          userId,
        },
      });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check user order existence', { groupOrderId, userId, error });
      return false;
    }
  }

  async getSubmittedCount(groupOrderId: GroupOrderId): Promise<number> {
    try {
      return await this.prisma.client.userOrder.count({
        where: {
          groupOrderId,
          status: UserOrderStatus.SUBMITTED,
        },
      });
    } catch (error) {
      logger.error('Failed to get submitted count', { groupOrderId, error });
      return 0;
    }
  }
}
