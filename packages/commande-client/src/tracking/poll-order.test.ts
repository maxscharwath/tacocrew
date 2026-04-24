import { describe, expect, test as it, mock } from 'bun:test';
import type { ActivePreorder, OrderStatus } from '../types';
import { noopLogger } from '../utils/logger';
import { type PollOrderSource, pollOrder } from './poll-order';

function makePreorder(status: OrderStatus, orderId = 'o1'): ActivePreorder {
  return {
    orderId,
    restaurantId: 'r1',
    status,
    serviceType: 'delivery',
    createdAt: '2026-04-24T09:45:00.000Z',
    items: [],
    totalAmount: 16,
    deliveryFee: 2,
  };
}

function makeOrderStub(sequence: readonly (readonly ActivePreorder[])[]): {
  order: PollOrderSource;
  calls: () => number;
} {
  let idx = 0;
  const empty: readonly ActivePreorder[] = [];
  const order: PollOrderSource = {
    getActivePreorders: mock(async () => {
      const next = sequence[idx];
      idx += 1;
      return next ?? empty;
    }),
    getOrderConfirmation: mock(async () => {
      throw new Error('not used');
    }),
  };
  return { order, calls: () => idx };
}

describe('pollOrder', () => {
  it('yields updates through the lifecycle and can be stopped by the consumer', async () => {
    const statuses: OrderStatus[] = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'delivered',
    ];
    const { order } = makeOrderStub(statuses.map((s) => [makePreorder(s)]));

    const iterable = pollOrder(
      { orderId: 'o1', restaurantId: 'r1', intervalMs: 1 },
      { order, logger: noopLogger, sleep: async () => undefined }
    );

    const seen: OrderStatus[] = [];
    for await (const update of iterable) {
      seen.push(update.status);
      if (update.status === 'delivered') break;
    }
    expect(seen).toEqual(statuses);
  });

  it('returns cleanly when signal is aborted before first poll', async () => {
    const { order } = makeOrderStub([[makePreorder('pending')]]);
    const controller = new AbortController();
    controller.abort();

    const iterable = pollOrder(
      { orderId: 'o1', restaurantId: 'r1', intervalMs: 1, signal: controller.signal },
      { order, logger: noopLogger, sleep: async () => undefined }
    );

    const seen: OrderStatus[] = [];
    for await (const update of iterable) {
      seen.push(update.status);
    }
    expect(seen).toEqual([]);
  });

  it('stops mid-stream when the signal aborts', async () => {
    const controller = new AbortController();
    const sequence: ActivePreorder[][] = [
      [makePreorder('pending')],
      [makePreorder('confirmed')],
      [makePreorder('preparing')],
    ];
    const { order } = makeOrderStub(sequence);

    const iterable = pollOrder(
      { orderId: 'o1', restaurantId: 'r1', intervalMs: 1, signal: controller.signal },
      {
        order,
        logger: noopLogger,
        sleep: async () => {
          controller.abort();
        },
      }
    );

    const seen: OrderStatus[] = [];
    for await (const update of iterable) {
      seen.push(update.status);
    }
    expect(seen).toEqual(['pending']);
  });

  it('falls back to getOrderConfirmation when order not in active preorders', async () => {
    const empty: readonly ActivePreorder[] = [];
    const stub: PollOrderSource = {
      getActivePreorders: mock(async () => empty),
      getOrderConfirmation: mock(async () => makePreorder('delivered', 'o1')),
    };

    const iterable = pollOrder(
      { orderId: 'o1', restaurantId: 'r1', intervalMs: 1 },
      { order: stub, logger: noopLogger, sleep: async () => undefined }
    );

    const seen: OrderStatus[] = [];
    for await (const update of iterable) {
      seen.push(update.status);
      if (update.status === 'delivered') break;
    }
    expect(seen).toEqual(['delivered']);
  });
});
