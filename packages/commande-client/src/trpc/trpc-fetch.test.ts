import { afterEach, beforeEach, describe, expect, test as it, mock } from 'bun:test';
import {
  NetworkError,
  NotFoundError,
  RateLimitError,
  RestaurantClosedError,
  ValidationError,
} from '../errors';
import { noopLogger } from '../utils/logger';
import { TrpcFetcher } from './trpc-fetch';

type FetchCall = {
  readonly url: string;
  readonly init: RequestInit;
};

function wrapSuccess(payload: unknown): string {
  return JSON.stringify([{ result: { data: { json: payload } } }]);
}

function wrapError(shape: {
  message: string;
  code: string;
  data?: Record<string, unknown>;
}): string {
  return JSON.stringify([{ error: shape }]);
}

function makeFetcher(responses: readonly Response[]): {
  fetcher: TrpcFetcher;
  calls: FetchCall[];
} {
  const calls: FetchCall[] = [];
  let index = 0;
  const fetchImpl = mock(async (input: string | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init: init ?? {} });
    const next = responses[index];
    index += 1;
    if (!next) throw new Error('unexpected extra fetch call');
    return next;
  });
  const fetcher = new TrpcFetcher({
    baseUrl: 'https://commande.app',
    logger: noopLogger,
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });
  return { fetcher, calls };
}

describe('TrpcFetcher', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('query', () => {
    it('builds a GET URL with batch=1 and URL-encoded input', async () => {
      const body = wrapSuccess({ id: 'abc' });
      const { fetcher, calls } = makeFetcher([new Response(body, { status: 200 })]);

      const result = await fetcher.query('restaurant.getBySlug', {
        slug: 'giga-tacos',
      });

      expect(result).toEqual({ id: 'abc' });
      expect(calls).toHaveLength(1);
      const call = calls[0];
      if (!call) throw new Error('missing call');
      expect(call.init.method).toBe('GET');
      expect(call.url.startsWith('https://commande.app/api/trpc/restaurant.getBySlug?batch=1&input='))
        .toBe(true);
      const url = new URL(call.url);
      const input = url.searchParams.get('input');
      if (!input) throw new Error('missing input param');
      expect(JSON.parse(input)).toEqual({ 0: { json: { slug: 'giga-tacos' } } });
      const headers = new Headers(call.init.headers);
      expect(headers.get('x-trpc-source')).toBe('nextjs-react');
      expect(headers.get('accept')).toBe('*/*');
    });

    it('maps tRPC NOT_FOUND error to NotFoundError', async () => {
      const body = wrapError({ message: 'nope', code: 'NOT_FOUND' });
      const { fetcher } = makeFetcher([new Response(body, { status: 404 })]);
      await expect(fetcher.query('restaurant.getBySlug', { slug: 'x' })).rejects.toThrow(
        NotFoundError
      );
    });

    it('maps tRPC TOO_MANY_REQUESTS to RateLimitError', async () => {
      const body = wrapError({ message: 'slow', code: 'TOO_MANY_REQUESTS' });
      const { fetcher } = makeFetcher([new Response(body, { status: 429 })]);
      await expect(fetcher.query('restaurant.getBySlug', { slug: 'x' })).rejects.toThrow(
        RateLimitError
      );
    });

    it('maps RESTAURANT_CLOSED data.code to RestaurantClosedError', async () => {
      const body = wrapError({
        message: 'closed',
        code: 'BAD_REQUEST',
        data: { code: 'RESTAURANT_CLOSED' },
      });
      const { fetcher } = makeFetcher([new Response(body, { status: 400 })]);
      await expect(fetcher.query('order.create', {})).rejects.toThrow(RestaurantClosedError);
    });

    it('throws ValidationError on invalid JSON', async () => {
      const { fetcher } = makeFetcher([new Response('<html>oops</html>', { status: 200 })]);
      await expect(fetcher.query('restaurant.getBySlug', { slug: 'x' })).rejects.toThrow(
        ValidationError
      );
    });

    it('throws NetworkError when fetch itself fails', async () => {
      const fetchImpl = mock(async () => {
        throw new Error('ECONNRESET');
      });
      const fetcher = new TrpcFetcher({
        baseUrl: 'https://commande.app',
        logger: noopLogger,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      });
      await expect(fetcher.query('restaurant.getBySlug', {})).rejects.toThrow(NetworkError);
    });
  });

  describe('mutation', () => {
    it('POSTs a batched json body', async () => {
      const body = wrapSuccess({ orderId: 'ord-1' });
      const { fetcher, calls } = makeFetcher([new Response(body, { status: 200 })]);

      const result = await fetcher.mutation('order.create', {
        restaurantId: 'r1',
      });

      expect(result).toEqual({ orderId: 'ord-1' });
      expect(calls).toHaveLength(1);
      const call = calls[0];
      if (!call) throw new Error('missing call');
      expect(call.init.method).toBe('POST');
      expect(call.url).toBe('https://commande.app/api/trpc/order.create?batch=1');
      const headers = new Headers(call.init.headers);
      expect(headers.get('content-type')).toBe('application/json');
      const rawBody = call.init.body;
      if (typeof rawBody !== 'string') throw new Error('expected string body');
      const parsedBody = JSON.parse(rawBody);
      expect(parsedBody).toEqual({ 0: { json: { restaurantId: 'r1' } } });
    });
  });
});
