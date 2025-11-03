/**
 * User service
 * @module services/user
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import type { GroupOrderId } from '@/schemas/group-order.schema';
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

  async getUserGroupOrders(userId: UserId): Promise<
    Array<{
      id: GroupOrderId;
      name: string | null;
      status: string;
      startDate: Date;
      endDate: Date;
      createdAt: Date;
    }>
  > {
    // Get group orders where user is leader
    const dbGroupOrders = await this.prisma.client.groupOrder.findMany({
      where: { leaderId: userId },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return dbGroupOrders.map((go) => ({
      id: go.id as GroupOrderId,
      name: go.name,
      status: go.status,
      startDate: go.startDate,
      endDate: go.endDate,
      createdAt: go.createdAt,
    }));
  }
}
