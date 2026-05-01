/**
 * Commande order event domain schema (Zod)
 * @module schemas/commande-order-event
 */
import { z } from 'zod';
import type { GroupOrderId } from '@/schemas/group-order.schema';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';

export type CommandeOrderEventId = Id<'CommandeOrderEvent'>;
export const CommandeOrderEventId = zId<CommandeOrderEventId>();

export const COMMANDE_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export type CommandeOrderStatus = (typeof COMMANDE_ORDER_STATUSES)[number];

export const COMMANDE_ORDER_EVENT_SOURCES = ['activePreorders', 'confirmation'] as const;
export type CommandeOrderEventSource = (typeof COMMANDE_ORDER_EVENT_SOURCES)[number];

export const CommandeOrderEventSchema = z.object({
  id: CommandeOrderEventId,
  commandeOrderId: z.string().min(1),
  groupOrderId: z.string().nullish(),
  status: z.enum(COMMANDE_ORDER_STATUSES),
  source: z.enum(COMMANDE_ORDER_EVENT_SOURCES),
  observedAt: z.coerce.date(),
  payload: z.unknown().nullish(),
  createdAt: z.coerce.date().optional(),
});

export type CommandeOrderEvent = z.infer<typeof CommandeOrderEventSchema>;

export type CreateCommandeOrderEventInput = {
  readonly commandeOrderId: string;
  readonly groupOrderId?: GroupOrderId | null;
  readonly status: CommandeOrderStatus;
  readonly source: CommandeOrderEventSource;
  readonly payload?: unknown;
};
