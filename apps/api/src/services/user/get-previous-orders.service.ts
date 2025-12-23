import { injectable } from 'tsyringe';
import { z } from 'zod';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { Taco } from '@/schemas/taco.schema';
import { MysteryTacoSchema, RegularTacoSchema, TacoKind } from '@/schemas/taco.schema';
import type { UserId } from '@/schemas/user.schema';
import { UserOrderItemsSchema } from '@/schemas/user-order.schema';
import { inject } from '@/shared/utils/inject.utils';

export interface PreviousOrder {
  tacoID: string; // base58-encoded tacoID
  orderCount: number;
  lastOrderedAt: Date;
  taco: Taco;
  recentGroupOrderName?: string | null;
}

// Extend regular taco schema with tacoIdHex (mystery tacos don't need it)
const RegularTacoWithHexSchema = RegularTacoSchema.extend({
  tacoIdHex: z.string().min(1).optional(),
});

const TacoWithTacoIDSchema = z.discriminatedUnion('kind', [
  RegularTacoWithHexSchema,
  MysteryTacoSchema, // Mystery tacos don't have tacoIdHex
]);

@injectable()
export class GetPreviousOrdersUseCase {
  private readonly prisma = inject(PrismaService);

  async execute(userId: UserId): Promise<PreviousOrder[]> {
    const orders = await this.fetchUserOrders(userId);
    const byTacoID = this.groupTacosByTacoID(orders);
    return this.sortByFrequencyAndRecency(byTacoID);
  }

  private fetchUserOrders(userId: UserId) {
    return this.prisma.client.userOrder.findMany({
      where: { userId },
      include: { groupOrder: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private groupTacosByTacoID(orders: Awaited<ReturnType<typeof this.fetchUserOrders>>) {
    const byTacoID = new Map<string, PreviousOrder>();

    for (const order of orders) {
      const items = UserOrderItemsSchema.safeParse(order.items);
      if (!items.success) continue;

      for (const taco of items.data.tacos) {
        const tacoWithHex = TacoWithTacoIDSchema.safeParse(taco);
        if (!tacoWithHex.success) continue;

        // Skip mystery tacos - they don't have tacoID
        if (tacoWithHex.data.kind === TacoKind.MYSTERY) continue;

        // Use stored tacoID (always present for regular tacos)
        const tacoID = tacoWithHex.data.tacoID;
        this.updateOrCreateTacoIDEntry(byTacoID, tacoID, tacoWithHex.data, order);
      }
    }

    return byTacoID;
  }

  private updateOrCreateTacoIDEntry(
    map: Map<string, PreviousOrder>,
    tacoID: string,
    taco: z.infer<typeof TacoWithTacoIDSchema>,
    order: { createdAt: Date; groupOrder: { name: string | null } }
  ) {
    const existing = map.get(tacoID);

    if (existing) {
      existing.orderCount += 1;
      if (order.createdAt > existing.lastOrderedAt) {
        existing.lastOrderedAt = order.createdAt;
        existing.taco = taco;
        existing.recentGroupOrderName = order.groupOrder.name;
      }
    } else {
      map.set(tacoID, {
        tacoID,
        orderCount: 1,
        lastOrderedAt: order.createdAt,
        taco,
        recentGroupOrderName: order.groupOrder.name,
      });
    }
  }

  private sortByFrequencyAndRecency(map: Map<string, PreviousOrder>): PreviousOrder[] {
    return Array.from(map.values()).sort((a, b) => {
      if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
      return b.lastOrderedAt.getTime() - a.lastOrderedAt.getTime();
    });
  }
}
