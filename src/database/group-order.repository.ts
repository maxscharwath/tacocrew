/**
 * Group order repository
 * @module database/group-order
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/database/prisma.service';
import { GroupOrder, GroupOrderStatus } from '@/types';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

/**
 * Repository for managing group orders
 */
@injectable()
export class GroupOrderRepository {
  private readonly prisma = inject(PrismaService);

  /**
   * Get group order by groupOrderId
   */
  async getGroupOrder(groupOrderId: string): Promise<GroupOrder | null> {
    try {
      const groupOrder = await this.prisma.client.groupOrder.findUnique({
        where: { groupOrderId },
      });

      if (!groupOrder) {
        return null;
      }

      return this.mapToGroupOrder(groupOrder);
    } catch (error) {
      logger.error('Failed to get group order', { groupOrderId, error });
      return null;
    }
  }

  /**
   * Create a new group order
   */
  async createGroupOrder(
    groupOrderId: string,
    data: {
      name?: string;
      leaderId: string;
      startDate: Date;
      endDate: Date;
    }
  ): Promise<GroupOrder> {
    try {
      const groupOrder = await this.prisma.client.groupOrder.create({
        data: {
          groupOrderId,
          name: data.name,
          leaderId: data.leaderId,
          startDate: data.startDate,
          endDate: data.endDate,
          status: GroupOrderStatus.OPEN,
        },
      });

      logger.debug('Group order created', { groupOrderId });
      return this.mapToGroupOrder(groupOrder);
    } catch (error) {
      logger.error('Failed to create group order', { groupOrderId, error });
      throw error;
    }
  }

  /**
   * Update group order
   */
  async updateGroupOrder(
    groupOrderId: string,
    updates: Partial<Pick<GroupOrder, 'name' | 'status' | 'startDate' | 'endDate'>>
  ): Promise<GroupOrder> {
    try {
      const groupOrder = await this.prisma.client.groupOrder.update({
        where: { groupOrderId },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.startDate !== undefined && { startDate: updates.startDate }),
          ...(updates.endDate !== undefined && { endDate: updates.endDate }),
          updatedAt: new Date(),
        },
      });

      logger.debug('Group order updated', { groupOrderId });
      return this.mapToGroupOrder(groupOrder);
    } catch (error) {
      logger.error('Failed to update group order', { groupOrderId, error });
      throw error;
    }
  }

  /**
   * Check if group order exists
   */
  async hasGroupOrder(groupOrderId: string): Promise<boolean> {
    try {
      const count = await this.prisma.client.groupOrder.count({
        where: { groupOrderId },
      });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check group order existence', { groupOrderId, error });
      return false;
    }
  }

  /**
   * Delete group order (cascades to user orders)
   */
  async deleteGroupOrder(groupOrderId: string): Promise<void> {
    try {
      await this.prisma.client.groupOrder.delete({
        where: { groupOrderId },
      });
      logger.info('Group order deleted', { groupOrderId });
    } catch (error) {
      logger.error('Failed to delete group order', { groupOrderId, error });
      throw error;
    }
  }

  /**
   * Map database model to GroupOrder
   */
  private mapToGroupOrder(groupOrder: {
    id: string;
    groupOrderId: string;
    name: string | null;
    leaderId: string;
    startDate: Date;
    endDate: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): GroupOrder {
    return {
      id: groupOrder.id,
      groupOrderId: groupOrder.groupOrderId,
      name: groupOrder.name || undefined,
      leader: groupOrder.leaderId, // For now, keep leader as string (will be userId)
      startDate: groupOrder.startDate,
      endDate: groupOrder.endDate,
      status: groupOrder.status as GroupOrderStatus,
      createdAt: groupOrder.createdAt,
      updatedAt: groupOrder.updatedAt,
    };
  }
}
