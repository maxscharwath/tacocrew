/**
 * User order repository
 * @module infrastructure/repositories/user-order
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { GroupOrderId } from '@/schemas/group-order.schema';
import type { UserId } from '@/schemas/user.schema';
import { createUserOrderFromDb, type UserOrder } from '@/schemas/user-order.schema';
import { UserOrderItems, UserOrderStatus } from '@/shared/types/types';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

/**
 * User order repository
 */
@injectable()
export class UserOrderRepository {
  private readonly prisma = inject(PrismaService);

  async findById(id: string): Promise<UserOrder | null> {
    try {
      const dbUserOrder = await this.prisma.client.userOrder.findUnique({
        where: { id },
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
      logger.error('Failed to find user order by id', { id, error });
      return null;
    }
  }

  async findByGroupAndUser(groupOrderId: GroupOrderId, userId: UserId): Promise<UserOrder[]> {
    try {
      const dbUserOrders = await this.prisma.client.userOrder.findMany({
        where: {
          groupOrderId,
          userId,
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return dbUserOrders.map(createUserOrderFromDb);
    } catch (error) {
      logger.error('Failed to find user orders', { groupOrderId, userId, error });
      return [];
    }
  }

  async findByGroup(groupOrderId: GroupOrderId): Promise<UserOrder[]> {
    try {
      const dbUserOrders = await this.prisma.client.userOrder.findMany({
        where: { groupOrderId },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      return dbUserOrders.map(createUserOrderFromDb);
    } catch (error) {
      logger.error('Failed to find user orders by group', { groupOrderId, error });
      return [];
    }
  }

  async create(data: {
    groupOrderId: GroupOrderId;
    userId: UserId;
    items: UserOrderItems;
    status: UserOrderStatus;
  }): Promise<UserOrder> {
    try {
      const dbUserOrder = await this.prisma.client.userOrder.create({
        data: {
          groupOrderId: data.groupOrderId,
          userId: data.userId,
          items: JSON.stringify(data.items),
          status: data.status,
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      logger.debug('User order created', { id: dbUserOrder.id });
      return createUserOrderFromDb(dbUserOrder);
    } catch (error) {
      logger.error('Failed to create user order', { error });
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      items?: UserOrderItems;
      status?: UserOrderStatus;
    }
  ): Promise<UserOrder> {
    try {
      const updateData: {
        items?: string;
        status?: UserOrderStatus;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (data.items !== undefined) {
        updateData.items = JSON.stringify(data.items);
      }
      if (data.status !== undefined) {
        updateData.status = data.status;
      }

      const dbUserOrder = await this.prisma.client.userOrder.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      logger.debug('User order updated', { id: dbUserOrder.id });
      return createUserOrderFromDb(dbUserOrder);
    } catch (error) {
      logger.error('Failed to update user order', { error });
      throw error;
    }
  }

  async updateStatus(id: string, status: UserOrderStatus): Promise<UserOrder> {
    try {
      const dbUserOrder = await this.prisma.client.userOrder.update({
        where: { id },
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

      logger.debug('User order status updated', { id: dbUserOrder.id });
      return createUserOrderFromDb(dbUserOrder);
    } catch (error) {
      logger.error('Failed to update user order status', { error });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.client.userOrder.delete({
        where: { id },
      });
      logger.info('User order deleted', { id });
    } catch (error) {
      logger.error('Failed to delete user order', { error });
      throw error;
    }
  }
}
