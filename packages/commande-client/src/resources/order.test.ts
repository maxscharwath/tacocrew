import { describe, expect, test as it, mock } from 'bun:test';
import createRequestJson from '../__fixtures__/order.create.request.json';
import createResponse from '../__fixtures__/order.create.response.json';
import activePending from '../__fixtures__/order.getActivePreorders.pending.json';
import confirmation from '../__fixtures__/order.getOrderConfirmation.json';
import restaurantStatus from '../__fixtures__/order.getRestaurantStatus.json';
import potentialResult from '../__fixtures__/order.potentialCreate.json';
import { RestaurantClosedError, ValidationError } from '../errors';
import { createOrderInputSchema } from '../schemas/order.schema';
import { TrpcFetcher } from '../trpc/trpc-fetch';
import { noopLogger } from '../utils/logger';
import { OrderResource } from './order';

const createRequest = createOrderInputSchema.parse(createRequestJson);

function wrap(payload: unknown): string {
  return JSON.stringify([{ result: { data: { json: payload } } }]);
}

function wrapErr(code: string, message: string, dataCode?: string): string {
  return JSON.stringify([
    { error: { message, code, data: { code: dataCode ?? code, httpStatus: 400 } } },
  ]);
}

function makeResource(responses: readonly Response[]): {
  resource: OrderResource;
  getCalls: () => readonly { url: string; init: RequestInit }[];
} {
  const calls: { url: string; init: RequestInit }[] = [];
  let idx = 0;
  const fetchImpl = mock(async (input: string | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init: init ?? {} });
    const next = responses[idx];
    idx += 1;
    if (!next) throw new Error('unexpected fetch');
    return next;
  });
  return {
    resource: new OrderResource(
      new TrpcFetcher({
        baseUrl: 'https://commande.app',
        logger: noopLogger,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ),
    getCalls: () => calls,
  };
}

describe('OrderResource', () => {
  it('create POSTs and returns orderId', async () => {
    const { resource, getCalls } = makeResource([
      new Response(wrap(createResponse), { status: 200 }),
    ]);
    const result = await resource.create(createRequest);
    expect(result.orderId).toBe('cmoconp6801uucm6h16mbqwlh');
    const calls = getCalls();
    const firstCall = calls[0];
    if (!firstCall) throw new Error('missing call');
    expect(firstCall.init.method).toBe('POST');
  });

  it('create maps RESTAURANT_CLOSED to RestaurantClosedError', async () => {
    const { resource } = makeResource([
      new Response(wrapErr('BAD_REQUEST', 'closed', 'RESTAURANT_CLOSED'), { status: 400 }),
    ]);
    await expect(resource.create(createRequest)).rejects.toThrow(RestaurantClosedError);
  });

  it('getActivePreorders parses list and sends no input on the wire', async () => {
    const { resource, getCalls } = makeResource([
      new Response(wrap(activePending), { status: 200 }),
    ]);
    const list = await resource.getActivePreorders({ restaurantId: 'r1' });
    expect(list).toHaveLength(1);
    const first = list[0];
    if (!first) throw new Error('missing preorder');
    expect(first.status).toBe('pending');
    const firstCall = getCalls()[0];
    if (!firstCall) throw new Error('missing call');
    // The commande.app web client always calls this procedure with undefined.
    expect(decodeURIComponent(firstCall.url)).toContain(
      '{"0":{"json":null,"meta":{"values":["undefined"],"v":1}}}'
    );
  });

  it('getOrderConfirmation parses the real confirmation payload', async () => {
    const { resource } = makeResource([new Response(wrap(confirmation), { status: 200 })]);
    const result = await resource.getOrderConfirmation({ orderId: 'cmrepdzqe05uydd6hocs6uc09' });
    expect(result.orderId).toBe('cmrepdzqe05uydd6hocs6uc09');
    expect(result.status).toBe('printed');
    expect(result.totalAmount).toBe(61);
    expect(result.items).toHaveLength(6);
  });

  it('getRestaurantStatus parses status', async () => {
    const { resource } = makeResource([new Response(wrap(restaurantStatus), { status: 200 })]);
    const status = await resource.getRestaurantStatus({
      restaurantId: 'r1',
      serviceType: 'delivery',
    });
    expect(status.acceptingOrders).toBe(true);
    expect(status.prepTimeMinutes).toBe(15);
  });

  it('potentialCreate returns { success: true } (no item validation server-side)', async () => {
    const { resource, getCalls } = makeResource([
      new Response(wrap(potentialResult), { status: 200 }),
    ]);
    const result = await resource.potentialCreate({
      restaurantId: 'r1',
      sessionId: '10000000-1000-4000-8000-100000000001',
      postalCode: '1007',
      address: 'Avenue de Rhodanie 40C',
      cartItems: [{ name: 'Tacos L', qty: 1, price: 11 }],
    });
    expect(result.success).toBe(true);
    const firstCall = getCalls()[0];
    if (!firstCall) throw new Error('missing call');
    const body = JSON.parse(String(firstCall.init.body));
    // Wire shape must match the commande.app web client exactly.
    expect(body[0].json).toEqual({
      restaurantId: 'r1',
      sessionId: '10000000-1000-4000-8000-100000000001',
      postalCode: '1007',
      address: 'Avenue de Rhodanie 40C',
      cartItems: [{ name: 'Tacos L', qty: 1, price: 11 }],
    });
  });

  it('throws ValidationError on malformed confirmation', async () => {
    const { resource } = makeResource([
      new Response(wrap({ orderId: 'x' }), { status: 200 }),
    ]);
    await expect(resource.getOrderConfirmation({ orderId: 'x' })).rejects.toThrow(ValidationError);
  });
});
