import { NotFoundError } from '../errors';
import type { ActivePreorder, Logger, Order, OrderStatusUpdate } from '../types';

export type PollOrderOptions = {
  readonly orderId: string;
  readonly restaurantId: string;
  readonly intervalMs?: number;
  readonly signal?: AbortSignal;
};

export type PollOrderSource = {
  getActivePreorders(
    input: { readonly restaurantId: string },
    opts?: { readonly signal?: AbortSignal }
  ): Promise<readonly ActivePreorder[]>;
  getOrderConfirmation(
    input: { readonly orderId: string },
    opts?: { readonly signal?: AbortSignal }
  ): Promise<Order>;
};

export type PollOrderDeps = {
  readonly order: PollOrderSource;
  readonly logger: Logger;
  readonly sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

const DEFAULT_INTERVAL_MS = 7000;

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      resolve();
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function pollOrder(
  opts: PollOrderOptions,
  deps: PollOrderDeps
): AsyncIterable<OrderStatusUpdate> {
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const sleep = deps.sleep ?? defaultSleep;

  return {
    async *[Symbol.asyncIterator](): AsyncIterator<OrderStatusUpdate> {
      let first = true;
      while (!opts.signal?.aborted) {
        if (!first) {
          await sleep(intervalMs, opts.signal);
          if (opts.signal?.aborted) return;
        }
        first = false;

        let update: OrderStatusUpdate | null = null;
        try {
          const preorders = await deps.order.getActivePreorders(
            { restaurantId: opts.restaurantId },
            { signal: opts.signal }
          );
          const match = preorders.find((p) => p.orderId === opts.orderId);
          if (match) {
            update = { orderId: match.orderId, status: match.status, order: match, at: new Date() };
          }
        } catch (err) {
          if (isAbort(err)) return;
          deps.logger.warn('pollOrder.getActivePreorders failed', {
            error: err instanceof Error ? err.message : String(err),
          });
        }

        if (!update) {
          try {
            const confirmation = await deps.order.getOrderConfirmation(
              { orderId: opts.orderId },
              { signal: opts.signal }
            );
            update = {
              orderId: confirmation.orderId,
              status: confirmation.status,
              order: confirmation,
              at: new Date(),
            };
          } catch (err) {
            if (isAbort(err)) return;
            if (err instanceof NotFoundError) {
              deps.logger.debug('pollOrder: order not found yet', { orderId: opts.orderId });
              continue;
            }
            deps.logger.warn('pollOrder.getOrderConfirmation failed', {
              error: err instanceof Error ? err.message : String(err),
            });
            continue;
          }
        }

        yield update;
      }
    },
  };
}

function isAbort(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err instanceof Error && err.name === 'AbortError') return true;
  return false;
}
