/**
 * Get user orders history use case
 * @module services/user
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OrderIdSchema } from '../../schemas/order.schema';
import { OrderId, UserId } from '../../shared/types/types';
import { inject } from '../../shared/utils/inject.utils';

/**
 * Get user orders history use case
 */
@injectable()
export class GetUserOrdersHistoryUseCase {
  private readonly prisma = inject(PrismaService);

  async execute(userId: UserId): Promise<
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
    const orders = await this.prisma.client.order.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        price: true,
        orderType: true,
        requestedFor: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(
      (order: {
        id: string;
        status: string;
        price: number | null;
        orderType: string;
        requestedFor: string;
        createdAt: Date;
      }) => {
        const parsedId = OrderIdSchema.parse(order.id);
        return {
          id: parsedId,
          orderId: parsedId,
          status: order.status,
          price: order.price,
          orderType: order.orderType,
          requestedFor: order.requestedFor,
          createdAt: order.createdAt,
        };
      }
    );
  }
}
