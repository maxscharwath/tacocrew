import { describe, expect, test as it, mock } from 'bun:test';
import geocodeFixture from '../__fixtures__/delivery.geocodeAddress.json';
import cityFixture from '../__fixtures__/delivery.getCityFromPostalCode.json';
import zoneFixture from '../__fixtures__/deliveryZone.getByPostalCode.json';
import { ValidationError } from '../errors';
import { TrpcFetcher } from '../trpc/trpc-fetch';
import { noopLogger } from '../utils/logger';
import { DeliveryResource } from './delivery';

function wrap(payload: unknown): string {
  return JSON.stringify([{ result: { data: { json: payload } } }]);
}

function makeResource(responses: readonly Response[]): DeliveryResource {
  let idx = 0;
  const fetchImpl = mock(async () => {
    const next = responses[idx];
    idx += 1;
    if (!next) throw new Error('unexpected fetch');
    return next;
  });
  return new DeliveryResource(
    new TrpcFetcher({
      baseUrl: 'https://commande.app',
      logger: noopLogger,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
  );
}

describe('DeliveryResource', () => {
  it('getZoneByPostalCode returns parsed zone', async () => {
    const resource = makeResource([new Response(wrap(zoneFixture), { status: 200 })]);
    const result = await resource.getZoneByPostalCode({
      restaurantId: 'r1',
      postalCode: '1007',
    });
    expect(result.available).toBe(true);
    expect(result.fee).toBe(2);
  });

  it('getCityFromPostalCode returns parsed city', async () => {
    const resource = makeResource([new Response(wrap(cityFixture), { status: 200 })]);
    const result = await resource.getCityFromPostalCode({ postalCode: '1007' });
    expect(result.city).toBe('Lausanne');
  });

  it('geocodeAddress returns parsed coordinates', async () => {
    const resource = makeResource([new Response(wrap(geocodeFixture), { status: 200 })]);
    const result = await resource.geocodeAddress({
      address: 'Rue Test 1',
      postalCode: '1007',
      city: 'Lausanne',
    });
    expect(result.latitude).toBeCloseTo(46.5397);
    expect(result.longitude).toBeCloseTo(6.6323);
  });

  it('throws ValidationError on malformed zone response', async () => {
    const resource = makeResource([new Response(wrap({}), { status: 200 })]);
    await expect(
      resource.getZoneByPostalCode({ restaurantId: 'r1', postalCode: '1007' })
    ).rejects.toThrow(ValidationError);
  });
});
