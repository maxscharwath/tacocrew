import { z } from 'zod';

export const deliveryZoneSchema = z.object({
  available: z.boolean(),
  fee: z.number().nonnegative(),
  estimatedMinutes: z.number().int().nullish(),
  postalCode: z.string(),
});

export const cityFromPostalCodeSchema = z.object({
  city: z.string(),
  postalCode: z.string(),
});

export const geocodeResultSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  formattedAddress: z.string().nullish(),
});
