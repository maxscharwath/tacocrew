/**
 * Commande order event repository
 * @module infrastructure/repositories/commande-order-event
 */

import { injectable } from 'tsyringe';
import { Prisma } from '@/generated/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  COMMANDE_ORDER_EVENT_SOURCES,
  COMMANDE_ORDER_STATUSES,
  type CommandeOrderEvent,
  type CommandeOrderEventSource,
  type CommandeOrderStatus,
} from '@/schemas/commande-order-event.schema';
import type { GroupOrderId } from '@/schemas/group-order.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

type DbRow = {
  id: string;
  commandeOrderId: string;
  groupOrderId: string | null;
  status: string;
  source: string;
  observedAt: Date;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
};

function fromDb(row: DbRow): CommandeOrderEvent {
  if (!(COMMANDE_ORDER_STATUSES as readonly string[]).includes(row.status)) {
    throw new Error(`Unknown commande order status in DB: ${row.status}`);
  }
  if (!(COMMANDE_ORDER_EVENT_SOURCES as readonly string[]).includes(row.source)) {
    throw new Error(`Unknown commande order event source in DB: ${row.source}`);
  }
  return {
    id: row.id as CommandeOrderEvent['id'],
    commandeOrderId: row.commandeOrderId,
    groupOrderId: row.groupOrderId,
    status: row.status as CommandeOrderStatus,
    source: row.source as CommandeOrderEventSource,
    observedAt: row.observedAt,
    payload: row.payload ?? null,
    createdAt: row.createdAt,
  };
}

@injectable()
export class CommandeOrderEventRepository {
  private readonly prisma = inject(PrismaService);

  async findLatestByCommandeOrderId(commandeOrderId: string): Promise<CommandeOrderEvent | null> {
    const row = await this.prisma.client.commandeOrderEvent.findFirst({
      where: { commandeOrderId },
      orderBy: { observedAt: 'desc' },
    });
    return row ? fromDb(row) : null;
  }

  async create(input: {
    readonly commandeOrderId: string;
    readonly groupOrderId?: GroupOrderId | null;
    readonly status: CommandeOrderStatus;
    readonly source: CommandeOrderEventSource;
    readonly payload?: unknown;
  }): Promise<CommandeOrderEvent> {
    try {
      const row = await this.prisma.client.commandeOrderEvent.create({
        data: {
          commandeOrderId: input.commandeOrderId,
          groupOrderId: input.groupOrderId ?? null,
          status: input.status,
          source: input.source,
          payload:
            input.payload === undefined || input.payload === null
              ? Prisma.JsonNull
              : (input.payload as Prisma.InputJsonValue),
        },
      });
      return fromDb(row);
    } catch (error) {
      logger.error('Failed to create commande order event', {
        commandeOrderId: input.commandeOrderId,
        groupOrderId: input.groupOrderId ?? null,
        status: input.status,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
