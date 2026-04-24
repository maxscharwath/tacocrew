import { describe, expect, test as it, mock } from 'bun:test';
import combosFixture from '../__fixtures__/menu.getCombinations.json';
import menuFixture from '../__fixtures__/menu.getMenuItems.json';
import { ValidationError } from '../errors';
import { TrpcFetcher } from '../trpc/trpc-fetch';
import { noopLogger } from '../utils/logger';
import { MenuResource } from './menu';

function wrap(payload: unknown): string {
  return JSON.stringify([{ result: { data: { json: payload } } }]);
}

function makeResource(responses: readonly Response[]): MenuResource {
  let idx = 0;
  const fetchImpl = mock(async () => {
    const next = responses[idx];
    idx += 1;
    if (!next) throw new Error('unexpected fetch');
    return next;
  });
  return new MenuResource(
    new TrpcFetcher({
      baseUrl: 'https://commande.app',
      logger: noopLogger,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
  );
}

describe('MenuResource', () => {
  it('getMenuItems returns products with imageUrl populated', async () => {
    const resource = makeResource([new Response(wrap(menuFixture), { status: 200 })]);
    const { products } = await resource.getMenuItems({ restaurantId: 'r1' });
    expect(products).toHaveLength(1);
    const first = products[0];
    if (!first) throw new Error('missing product');
    expect(first.imageUrl).toBe(
      'https://commande.app/uploads/products/1776718615649-fd29d26d37b70e45.jpg'
    );
    expect(first.optionGroups).toHaveLength(2);
    expect(first.variants).toBeInstanceOf(Array);
  });

  it('getCombinations returns parsed combinations', async () => {
    const resource = makeResource([new Response(wrap(combosFixture), { status: 200 })]);
    const result = await resource.getCombinations({ restaurantId: 'r1' });
    expect(result).toHaveLength(1);
    const first = result[0];
    if (!first) throw new Error('missing combo');
    expect(first.slots).toHaveLength(2);
  });

  it('throws ValidationError when required fields are missing', async () => {
    const resource = makeResource([new Response(wrap([{ id: 'broken' }]), { status: 200 })]);
    await expect(resource.getMenuItems({ restaurantId: 'r1' })).rejects.toThrow(ValidationError);
  });
});
