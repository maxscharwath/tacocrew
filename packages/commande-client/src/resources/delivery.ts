import { ValidationError } from '../errors';
import {
  cityFromPostalCodeSchema,
  deliveryZoneSchema,
  geocodeResultSchema,
} from '../schemas/delivery.schema';
import type { TrpcFetcher } from '../trpc/trpc-fetch';
import type { DeliveryZone, GeocodeResult } from '../types';

export type CallOpts = {
  readonly signal?: AbortSignal;
};

export type CityFromPostalCodeResult = {
  readonly city: string;
  readonly postalCode: string;
};

function parseOrThrow<T>(
  schema: { safeParse(v: unknown): { success: true; data: T } | { success: false; error: Error } },
  raw: unknown,
  label: string
): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(`${label} parse failed: ${result.error.message}`, {
      cause: result.error,
    });
  }
  return result.data;
}

export class DeliveryResource {
  constructor(private readonly trpc: TrpcFetcher) {}

  async getZoneByPostalCode(
    input: { readonly restaurantId: string; readonly postalCode: string },
    opts: CallOpts = {}
  ): Promise<DeliveryZone> {
    const raw = await this.trpc.query('deliveryZone.getByPostalCode', input, opts);
    return parseOrThrow(deliveryZoneSchema, raw, 'deliveryZone.getByPostalCode');
  }

  async getCityFromPostalCode(
    input: { readonly postalCode: string },
    opts: CallOpts = {}
  ): Promise<CityFromPostalCodeResult> {
    const raw = await this.trpc.query('order.getCityFromPostalCode', input, opts);
    return parseOrThrow(cityFromPostalCodeSchema, raw, 'order.getCityFromPostalCode');
  }

  async geocodeAddress(
    input: {
      readonly address: string;
      readonly postalCode: string;
      readonly city: string;
    },
    opts: CallOpts = {}
  ): Promise<GeocodeResult> {
    const raw = await this.trpc.query('order.geocodeAddress', input, opts);
    return parseOrThrow(geocodeResultSchema, raw, 'order.geocodeAddress');
  }
}
