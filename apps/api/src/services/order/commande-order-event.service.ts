/**
 * Commande order event service — idempotent recording of status transitions
 * observed by the /orders/{id}/status endpoint.
 *
 * Writes a new row only when the latest stored status differs from the
 * freshly observed one. Transition writes emit an `info` log; no-ops emit
 * `debug`. Failures bubble up and are swallowed by the route's try/catch so
 * observability never breaks order tracking.
 *
 * @module services/order/commande-order-event
 */

import { injectable } from 'tsyringe';
import { CommandeOrderEventRepository } from '@/infrastructure/repositories/commande-order-event.repository';
import type {
  CommandeOrderEventSource,
  CommandeOrderStatus,
} from '@/schemas/commande-order-event.schema';
import type { GroupOrderId } from '@/schemas/group-order.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

export type RecordIfChangedInput = {
  readonly commandeOrderId: string;
  readonly groupOrderId?: GroupOrderId | null;
  readonly status: CommandeOrderStatus;
  readonly source: CommandeOrderEventSource;
  readonly payload?: unknown;
};

export type RecordIfChangedOutcome = 'created' | 'unchanged';

@injectable()
export class CommandeOrderEventService {
  private readonly repository = inject(CommandeOrderEventRepository);

  async recordIfChanged(input: RecordIfChangedInput): Promise<RecordIfChangedOutcome> {
    const last = await this.repository.findLatestByCommandeOrderId(input.commandeOrderId);

    if (last && last.status === input.status) {
      logger.debug('order.status.unchanged', {
        commandeOrderId: input.commandeOrderId,
        groupOrderId: input.groupOrderId ?? null,
        status: input.status,
      });
      return 'unchanged';
    }

    await this.repository.create({
      commandeOrderId: input.commandeOrderId,
      groupOrderId: input.groupOrderId ?? null,
      status: input.status,
      source: input.source,
      payload: input.payload,
    });

    const secondsSinceLast = last
      ? Math.round((Date.now() - last.observedAt.getTime()) / 1000)
      : null;

    logger.info('order.status.transition', {
      commandeOrderId: input.commandeOrderId,
      groupOrderId: input.groupOrderId ?? null,
      from: last?.status ?? null,
      to: input.status,
      source: input.source,
      secondsSinceLast,
    });

    return 'created';
  }
}
