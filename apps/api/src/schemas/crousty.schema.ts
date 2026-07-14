/**
 * Tasty Crousty domain schema (Zod)
 *
 * A Crousty order line references a commande.app Crousty product (Sweet / Spicy
 * / Custom) plus the options chosen across its groups (size, and for Custom:
 * meat / sauce / toggles). Options are stored by group name + option name — the
 * stable keys — and re-resolved to commande.app itemIds at submission time,
 * mirroring how tacos store slugs rather than opaque IDs.
 * @module schemas/crousty
 */

import { z } from 'zod';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';

/** Crousty order-line ID type — branded string. */
export type CroustyId = Id<'Crousty'>;
export const CroustyId = zId<CroustyId>();

export const CROUSTY_VARIANTS = ['sweet', 'spicy', 'custom'] as const;
export type CroustyVariant = (typeof CROUSTY_VARIANTS)[number];

/**
 * A single option chosen within a Crousty group. `groupName`/`optionName` are
 * the stable keys used to re-resolve the commande.app itemId at submission.
 */
export const CroustyOptionSelectionSchema = z.object({
  groupName: z.string().min(1),
  optionName: z.string().min(1),
});

export type CroustyOptionSelection = z.infer<typeof CroustyOptionSelectionSchema>;

/**
 * A Crousty order line.
 *
 * `code` is the product slug (e.g. `tasty_crousty_custom`) used to resolve the
 * product at submission; `options` carries every selected group/option pair.
 */
export const CroustySchema = z.object({
  id: CroustyId,
  code: z.string().min(1),
  name: z.string().min(1),
  variant: z.enum(CROUSTY_VARIANTS),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  options: z.array(CroustyOptionSelectionSchema),
});

export type Crousty = z.infer<typeof CroustySchema>;
