import { describe, expect, test as it, mock } from 'bun:test';
import smsFixture from '../__fixtures__/user.checkSmsRequirementPublic.json';
import { ValidationError } from '../errors';
import { TrpcFetcher } from '../trpc/trpc-fetch';
import { noopLogger } from '../utils/logger';
import { UserResource } from './user';

function wrap(payload: unknown): string {
  return JSON.stringify([{ result: { data: { json: payload } } }]);
}

function makeResource(responses: readonly Response[]): UserResource {
  let idx = 0;
  const fetchImpl = mock(async () => {
    const next = responses[idx];
    idx += 1;
    if (!next) throw new Error('unexpected fetch');
    return next;
  });
  return new UserResource(
    new TrpcFetcher({
      baseUrl: 'https://commande.app',
      logger: noopLogger,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
  );
}

describe('UserResource', () => {
  it('checkSmsRequirementPublic returns parsed result', async () => {
    const resource = makeResource([new Response(wrap(smsFixture), { status: 200 })]);
    const result = await resource.checkSmsRequirementPublic({
      restaurantId: 'r1',
      phone: '+41 21 000 00 00',
    });
    expect(result.required).toBe(false);
  });

  it('throws ValidationError on missing required field', async () => {
    const resource = makeResource([new Response(wrap({}), { status: 200 })]);
    await expect(resource.checkSmsRequirementPublic({ restaurantId: 'r1' })).rejects.toThrow(
      ValidationError
    );
  });
});
