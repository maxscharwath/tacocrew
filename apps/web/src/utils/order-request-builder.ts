/**
 * Build API request body from parsed form data
 * @module utils/order-request-builder
 */

import type { UpsertUserOrderBody } from '@/lib/api/orders';
import { TacoKind } from '@/lib/api/types';
import type { ParsedOrderFormData } from './order-form-parser';

/**
 * Build upsert user order request body from parsed form data
 */
export function buildUpsertOrderRequest(data: ParsedOrderFormData): UpsertUserOrderBody {
  const isMystery = data.kind === TacoKind.MYSTERY;
  // Allow tacos with empty meats/sauces - they'll be added automatically when submitting to external backend
  const hasTaco = data.size !== undefined;

  return {
    items: {
      tacos:
        hasTaco && data.size
          ? [
              {
                size: data.size,
                meats: isMystery ? [] : data.meats,
                sauces: isMystery ? [] : data.sauces,
                garnitures: isMystery ? [] : data.garnitures,
                note: data.note,
                quantity: 1,
                kind: data.kind,
              },
            ]
          : [],
      extras: data.extras,
      drinks: data.drinks,
      desserts: data.desserts,
    },
  };
}
