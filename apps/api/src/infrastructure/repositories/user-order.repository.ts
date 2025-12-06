/**
 * User order repository
 * @module infrastructure/repositories/user-order
 */

import { injectable } from 'tsyringe';
import { Prisma } from '@/generated/client';
import type { GroupOrderId } from '@/schemas/group-order.schema';
import type { UserId } from '@/schemas/user.schema';
import { createUserOrderFromDb, type UserOrder } from '@/schemas/user-order.schema';
import { UserOrderItems } from '@/shared/types/types';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { extractTacoIdsHex } from '@/shared/utils/order-taco-id.utils';
import { PrismaService } from '@/infrastructure/database/prisma.service';

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
              name: true,
            },
          },
          reimbursedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          paidByUserRef: {
            select: {
              id: true,
              name: true,
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
              name: true,
            },
          },
          reimbursedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          paidByUserRef: {
            select: {
              id: true,
              name: true,
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
              name: true,
            },
          },
          reimbursedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          paidByUserRef: {
            select: {
              id: true,
              name: true,
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
    tacoIdsHex?: string[] | null; // Array of taco IDs in hex format (will be stored as Json)
  }): Promise<UserOrder> {
    try {
      const dbUserOrder = await this.prisma.client.userOrder.create({
        data: {
          groupOrderId: data.groupOrderId,
          userId: data.userId,
          items: data.items as unknown as Prisma.InputJsonValue,
          tacoIdsHex: data.tacoIdsHex
            ? (data.tacoIdsHex as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      logger.debug('User order created', { id: dbUserOrder.id });
      return createUserOrderFromDb(dbUserOrder);
    } catch (error: unknown) {
      // Check if it's a foreign key constraint error (user doesn't exist)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2003' &&
        'meta' in error &&
        error.meta &&
        typeof error.meta === 'object' &&
        'field_name' in error.meta &&
        error.meta.field_name === 'userOrder_userId_fkey'
      ) {
        logger.error('Failed to create user order: user does not exist', {
          userId: data.userId,
          groupOrderId: data.groupOrderId,
          error,
        });
        throw new Error(
          `User not found: ${data.userId}. Please ensure you are properly authenticated.`
        );
      }

      logger.error('Failed to create user order', {
        userId: data.userId,
        groupOrderId: data.groupOrderId,
        error,
      });
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      items?: UserOrderItems;
      tacoIdsHex?: string[] | null; // Array of taco IDs in hex format (will be stored as Json)
      reimbursed?: boolean;
      reimbursedAt?: Date | null;
      reimbursedByUserId?: string | null;
      paidByUser?: boolean;
      paidByUserAt?: Date | null;
      paidByUserId?: string | null;
    }
  ): Promise<UserOrder> {
    try {
      const updateData: {
        items?: Prisma.InputJsonValue;
        tacoIdsHex?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
        reimbursed?: boolean;
        reimbursedAt?: Date | null;
        reimbursedById?: string | null;
        paidByUser?: boolean;
        paidByUserAt?: Date | null;
        paidByUserId?: string | null;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (data.items !== undefined) {
        updateData.items = data.items as unknown as Prisma.InputJsonValue;
        // Recompute taco IDs in hex format when items are updated
        const tacoIdsHex = extractTacoIdsHex(data.items);
        updateData.tacoIdsHex =
          tacoIdsHex.length > 0
            ? (tacoIdsHex as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull;
      }
      if (data.tacoIdsHex !== undefined) {
        updateData.tacoIdsHex = data.tacoIdsHex
          ? (data.tacoIdsHex as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull;
      }
      if (data.reimbursed !== undefined) {
        updateData.reimbursed = data.reimbursed;
      }
      if (data.reimbursedAt !== undefined) {
        updateData.reimbursedAt = data.reimbursedAt ?? null;
      }
      if (data.reimbursedByUserId !== undefined) {
        updateData.reimbursedById = data.reimbursedByUserId ?? null;
      }
      if (data.paidByUser !== undefined) {
        updateData.paidByUser = data.paidByUser;
      }
      if (data.paidByUserAt !== undefined) {
        updateData.paidByUserAt = data.paidByUserAt ?? null;
      }
      if (data.paidByUserId !== undefined) {
        updateData.paidByUserId = data.paidByUserId ?? null;
      }

      const dbUserOrder = await this.prisma.client.userOrder.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              name: true,
            },
          },
          reimbursedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          paidByUserRef: {
            select: {
              id: true,
              name: true,
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
