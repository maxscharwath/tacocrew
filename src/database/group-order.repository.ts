/**
 * Group order repository
 * @module database/group-order
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/database/prisma.service';
import { GroupOrderIdSchema } from '@/domain/schemas/group-order.schema';
import { UserIdSchema } from '@/domain/schemas/user.schema';
import { GroupOrder, GroupOrderId, GroupOrderStatus, UserId } from '@/types';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

/**
 * Repository for managing group orders
 */
@injectable()
export class GroupOrderRepository {
  private readonly prisma = inject(PrismaService);

  /**
   * Get group order by id
   */
  async getGroupOrder(id: GroupOrderId): Promise<GroupOrder | null> {
    try {
      const groupOrder = await this.prisma.client.groupOrder.findUnique({
        where: { id },
      });

      if (!groupOrder) {
        return null;
      }

      return this.mapToGroupOrder(groupOrder);
    } catch (error) {
      logger.error('Failed to get group order', { id, error });
      return null;
    }
  }

  /**
   * Create a new group order
   */
  async createGroupOrder(
    id: GroupOrderId,
    data: {
      name?: string;
      leaderId: UserId;
      startDate: Date;
      endDate: Date;
    }
  ): Promise<GroupOrder> {
    try {
      const groupOrder = await this.prisma.client.groupOrder.create({
        data: {
          id: id as string,
          name: data.name,
          leaderId: data.leaderId as string,
          startDate: data.startDate,
          endDate: data.endDate,
          status: GroupOrderStatus.OPEN,
        },
      });

      logger.debug('Group order created', { id });
      return this.mapToGroupOrder(groupOrder);
    } catch (error) {
      logger.error('Failed to create group order', { id, error });
      throw error;
    }
  }

  /**
   * Update group order
   */
  async updateGroupOrder(
    id: GroupOrderId,
    updates: Partial<Pick<GroupOrder, 'name' | 'status' | 'startDate' | 'endDate'>>
  ): Promise<GroupOrder> {
    try {
      const groupOrder = await this.prisma.client.groupOrder.update({
        where: { id },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.startDate !== undefined && { startDate: updates.startDate }),
          ...(updates.endDate !== undefined && { endDate: updates.endDate }),
          updatedAt: new Date(),
        },
      });

      logger.debug('Group order updated', { id });
      return this.mapToGroupOrder(groupOrder);
    } catch (error) {
      logger.error('Failed to update group order', { id, error });
      throw error;
    }
  }

  /**
   * Check if group order exists
   */
  async hasGroupOrder(id: GroupOrderId): Promise<boolean> {
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

  /**
   * Delete group order (cascades to user orders)
   */
  async deleteGroupOrder(id: GroupOrderId): Promise<void> {
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

  /**
   * Map database model to GroupOrder
   */
  private mapToGroupOrder(groupOrder: {
    id: string;
    name: string | null;
    leaderId: string;
    startDate: Date;
    endDate: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): GroupOrder {
    const parsedId = GroupOrderIdSchema.parse(groupOrder.id);
    return {
      id: parsedId,
      groupOrderId: parsedId,
      name: groupOrder.name || undefined,
      leader: UserIdSchema.parse(groupOrder.leaderId),
      startDate: groupOrder.startDate,
      endDate: groupOrder.endDate,
      status: groupOrder.status as GroupOrderStatus,
      createdAt: groupOrder.createdAt,
      updatedAt: groupOrder.updatedAt,
    };
  }
}
