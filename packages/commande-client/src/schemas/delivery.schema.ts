import { z } from 'zod';
import type { DeliveryZone } from '../types';

// Real `deliveryZone.getByPostalCode` payload (captured 2026-07 via HAR):
// { postalCode, isClosed, closureMessage, minOrderAmount, deliveryFee,
//   deliveryTimeMinutes, minOrderMode } — normalize into the stable public
// `DeliveryZone` shape (`available` = zone exists and is not closed).
export const deliveryZoneSchema = z
  .object({
    postalCode: z.string(),
    isClosed: z.boolean().nullish(),
    closureMessage: z.string().nullish(),
    minOrderAmount: z.number().nullish(),
    deliveryFee: z.number().nonnegative().nullish(),
    deliveryTimeMinutes: z.number().int().nullish(),
    minOrderMode: z.string().nullish(),
  })
  .passthrough()
  .transform(
    (raw): DeliveryZone => ({
      available: raw.isClosed !== true,
      fee: raw.deliveryFee ?? 0,
      estimatedMinutes: raw.deliveryTimeMinutes ?? null,
      postalCode: raw.postalCode,
      minOrderAmount: raw.minOrderAmount ?? null,
      minOrderMode: raw.minOrderMode ?? null,
      closureMessage: raw.closureMessage ?? null,
    })
  );

// Real payload is `{ city }` only — the postal code is echoed back by the
// resource from its own input.
export const cityFromPostalCodeSchema = z.object({
  city: z.string(),
  postalCode: z.string().optional(),
});

export const geocodeResultSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  formattedAddress: z.string().nullish(),
});
