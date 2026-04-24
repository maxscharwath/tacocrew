import { describe, expect, test as it, mock } from 'bun:test';
import getAllPublicFixture from '../__fixtures__/restaurant.getAllPublic.json';
import getBySlugFixture from '../__fixtures__/restaurant.getBySlug.json';
import { NotFoundError, ValidationError } from '../errors';
import { TrpcFetcher } from '../trpc/trpc-fetch';
import { noopLogger } from '../utils/logger';
import { RestaurantResource } from './restaurant';

function wrap(payload: unknown): string {
  return JSON.stringify([{ result: { data: { json: payload } } }]);
}

function wrapError(code: string, message: string): string {
  return JSON.stringify([{ error: { message, code, data: { code, httpStatus: 404 } } }]);
}

function makeResource(responses: readonly Response[]): RestaurantResource {
  let idx = 0;
  const fetchImpl = mock(async () => {
    const next = responses[idx];
    idx += 1;
    if (!next) throw new Error('unexpected fetch');
    return next;
  });
  const trpc = new TrpcFetcher({
    baseUrl: 'https://commande.app',
    logger: noopLogger,
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });
  return new RestaurantResource(trpc);
}

describe('RestaurantResource', () => {
  it('getBySlug returns parsed restaurant', async () => {
    const resource = makeResource([new Response(wrap(getBySlugFixture), { status: 200 })]);
    const result = await resource.getBySlug({ slug: 'giga-tacos-pontaise-lausanne' });
    expect(result.id).toBe('cmmcc6j8a00056h175p38kx6l');
    expect(result.slug).toBe('giga-tacos-pontaise-lausanne');
    expect(result.name).toBe('Giga Tacos Pontaise');
  });

  it('getAllPublic returns parsed list', async () => {
    const resource = makeResource([new Response(wrap(getAllPublicFixture), { status: 200 })]);
    const result = await resource.getAllPublic();
    expect(result).toHaveLength(1);
    const first = result[0];
    if (!first) throw new Error('missing restaurant');
    expect(first.slug).toBe('giga-tacos-pontaise-lausanne');
  });

  it('getById throws NotFoundError when API returns NOT_FOUND', async () => {
    const resource = makeResource([
      new Response(wrapError('NOT_FOUND', 'missing'), { status: 404 }),
    ]);
    await expect(resource.getById({ restaurantId: 'bogus' })).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError on malformed payload', async () => {
    const resource = makeResource([
      new Response(wrap({ id: 42, slug: 'x', name: 'y' }), { status: 200 }),
    ]);
    await expect(resource.getBySlug({ slug: 'x' })).rejects.toThrow(ValidationError);
  });
});
