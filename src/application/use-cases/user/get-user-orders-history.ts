/**
 * Get user orders history use case
 * @module application/use-cases/user
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/database/prisma.service';
import { inject } from '@/utils/inject';

/**
 * Get user orders history use case
 */
@injectable()
export class GetUserOrdersHistoryUseCase {
  private readonly prisma = inject(PrismaService);

  async execute(userId: string): Promise<
    Array<{
      id: string;
      orderId: string;
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
        orderId: true,
        status: true,
        price: true,
        orderType: true,
        requestedFor: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }
}
