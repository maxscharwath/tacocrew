/**
 * Group order repository
 * @module infrastructure/repositories/group-order
 */

import { injectable } from 'tsyringe';
import {
  createGroupOrderFromDb,
  type GroupOrder,
  type GroupOrderId,
} from '@/schemas/group-order.schema';
import type { UserId } from '@/schemas/user.schema';
import { GroupOrderStatus } from '@/shared/types/types';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { PrismaService } from '@/infrastructure/database/prisma.service';

/**
 * Group order repository
 */
@injectable()
export class GroupOrderRepository {
  private readonly prisma = inject(PrismaService);

  async create(data: {
    name?: string;
    leaderId: UserId;
    startDate: Date;
    endDate: Date;
    organizationId?: string | null;
  }): Promise<GroupOrder> {
    try {
      const dbGroupOrder = await this.prisma.client.groupOrder.create({
        data: {
          name: data.name,
          leaderId: data.leaderId,
          startDate: data.startDate,
          endDate: data.endDate,
          status: GroupOrderStatus.OPEN,
          organizationId: data.organizationId ?? null,
        },
        include: {
          leader: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      logger.debug('Group order created', { id: dbGroupOrder.id });
      return createGroupOrderFromDb(dbGroupOrder);
    } catch (error) {
      logger.error('Failed to create group order', { error });
      throw error;
    }
  }

  async findById(id: GroupOrderId): Promise<GroupOrder | null> {
    try {
      const dbGroupOrder = await this.prisma.client.groupOrder.findUnique({
        where: { id },
      });

      return dbGroupOrder ? createGroupOrderFromDb(dbGroupOrder) : null;
    } catch (error) {
      logger.error('Failed to get group order', { id, error });
      return null;
    }
  }

  async update(
    id: GroupOrderId,
    updates: Partial<
      Pick<GroupOrder, 'name' | 'status' | 'startDate' | 'endDate' | 'sessionId' | 'fee'>
    >
  ): Promise<GroupOrder> {
    try {
      const dbGroupOrder = await this.prisma.client.groupOrder.update({
        where: { id },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.startDate !== undefined && { startDate: updates.startDate }),
          ...(updates.endDate !== undefined && { endDate: updates.endDate }),
          ...(updates.sessionId !== undefined && { sessionId: updates.sessionId }),
          ...(updates.fee !== undefined && { fee: updates.fee }),
          updatedAt: new Date(),
        },
      });

      logger.debug('Group order updated', { id });
      return createGroupOrderFromDb(dbGroupOrder);
    } catch (error) {
      logger.error('Failed to update group order', { id, error });
      throw error;
    }
  }

  async exists(id: GroupOrderId): Promise<boolean> {
    try {
      const count = await this.prisma.client.groupOrder.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check group order existence', { id, error });
      return false;
    }
  }

  async delete(id: GroupOrderId): Promise<void> {
    try {
      await this.prisma.client.groupOrder.delete({
        where: { id },
      });
      logger.info('Group order deleted', { id });
    } catch (error) {
      logger.error('Failed to delete group order', { id, error });
      throw error;
    }
  }
}
