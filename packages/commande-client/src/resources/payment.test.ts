import { describe, expect, test as it, mock } from 'bun:test';
import methodsFixture from '../__fixtures__/paymentSettings.getAvailableMethods.json';
import { ValidationError } from '../errors';
import { TrpcFetcher } from '../trpc/trpc-fetch';
import { noopLogger } from '../utils/logger';
import { PaymentResource } from './payment';

function wrap(payload: unknown): string {
  return JSON.stringify([{ result: { data: { json: payload } } }]);
}

function makeResource(responses: readonly Response[]): PaymentResource {
  let idx = 0;
  const fetchImpl = mock(async () => {
    const next = responses[idx];
    idx += 1;
    if (!next) throw new Error('unexpected fetch');
    return next;
  });
  return new PaymentResource(
    new TrpcFetcher({
      baseUrl: 'https://commande.app',
      logger: noopLogger,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
  );
}

describe('PaymentResource', () => {
  it('getAvailableMethods returns parsed list', async () => {
    const resource = makeResource([new Response(wrap(methodsFixture), { status: 200 })]);
    const result = await resource.getAvailableMethods({ restaurantId: 'r1' });
    expect(result.methods).toContain('twint');
    expect(result.methods).toContain('stripe');
  });

  it('throws ValidationError on unknown method value', async () => {
    const resource = makeResource([
      new Response(wrap({ methods: ['unknown'] }), { status: 200 }),
    ]);
    await expect(resource.getAvailableMethods({ restaurantId: 'r1' })).rejects.toThrow(
      ValidationError
    );
  });
});
