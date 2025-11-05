/**
 * User service
 * @module services/user
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import {
  canAcceptOrders,
  createGroupOrderFromDb,
  type GroupOrderId,
} from '@/schemas/group-order.schema';
import type { OrderId } from '@/schemas/order.schema';
import type { User, UserId } from '@/schemas/user.schema';
import { GetUserOrdersHistoryUseCase } from '@/services/user/get-user-orders-history.service';
import { inject } from '@/shared/utils/inject.utils';

/**
 * User service
 */
@injectable()
export class UserService {
  private readonly userRepository = inject(UserRepository);
  private readonly prisma = inject(PrismaService);
  private readonly getUserOrdersHistoryUseCase = inject(GetUserOrdersHistoryUseCase);

  async getUserById(userId: UserId): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    return user;
  }

  getUserOrderHistory(userId: UserId): Promise<
    Array<{
      id: OrderId;
      orderId: OrderId;
      status: string;
      price: number | null;
      orderType: string;
      requestedFor: string;
      createdAt: Date;
    }>
  > {
    return this.getUserOrdersHistoryUseCase.execute(userId);
  }

  async getUserGroupOrders(_userId: UserId): Promise<
    Array<{
      id: GroupOrderId;
      name: string | null;
      status: string;
      canAcceptOrders: boolean;
      startDate: Date;
      endDate: Date;
      createdAt: Date;
    }>
  > {
    // Get all group orders (not just where user is leader)
    const dbGroupOrders = await this.prisma.client.groupOrder.findMany({
      select: {
        id: true,
        name: true,
        leaderId: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return dbGroupOrders.map((go) => {
      const groupOrder = createGroupOrderFromDb(go);
      return {
        id: go.id as GroupOrderId,
        name: go.name,
        status: go.status,
        canAcceptOrders: canAcceptOrders(groupOrder),
        startDate: go.startDate,
        endDate: go.endDate,
        createdAt: go.createdAt,
      };
    });
  }
}
