/**
 * User service (application service)
 * Orchestrates use cases for user-related operations
 * @module services/user
 */

import { injectable } from 'tsyringe';
import { GetUserOrdersHistoryUseCase } from '@/application/use-cases/user/get-user-orders-history';
import { PrismaService } from '@/database/prisma.service';
import { GroupOrderIdSchema } from '@/domain/schemas/group-order.schema';
import type { User } from '@/domain/schemas/user.schema';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { GroupOrderId, UserId } from '@/types';
import { NotFoundError } from '@/utils/errors';
import { inject } from '@/utils/inject';

/**
 * User Service
 * Application service that orchestrates use cases
 */
@injectable()
export class UserService {
  private readonly userRepository = inject(UserRepository);
  private readonly getUserOrdersHistoryUseCase = inject(GetUserOrdersHistoryUseCase);
  private readonly prismaService = inject(PrismaService);

  /**
   * Get user by ID
   */
  async getUserById(userId: UserId): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Get user's order history
   */
  async getUserOrderHistory(userId: UserId) {
    return await this.getUserOrdersHistoryUseCase.execute(userId);
  }

  /**
   * Get user's group orders (as leader)
   */
  async getUserGroupOrders(userId: UserId): Promise<
    Array<{
      id: GroupOrderId;
      groupOrderId: GroupOrderId;
      name: string | null;
      status: string;
      startDate: Date;
      endDate: Date;
      createdAt: Date;
    }>
  > {
    // This will be moved to a use case
    const groupOrders = await this.prismaService.client.groupOrder.findMany({
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

    return groupOrders.map((go) => {
      const parsedId = GroupOrderIdSchema.parse(go.id);
      return {
        id: parsedId,
        groupOrderId: parsedId,
        name: go.name,
        status: go.status,
        startDate: go.startDate,
        endDate: go.endDate,
        createdAt: go.createdAt,
      };
    });
  }
}
