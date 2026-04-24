import { DeliveryResource } from './resources/delivery';
import { MenuResource } from './resources/menu';
import { OrderResource } from './resources/order';
import { PaymentResource } from './resources/payment';
import { RestaurantResource } from './resources/restaurant';
import { UserResource } from './resources/user';
import { type PollOrderOptions, pollOrder } from './tracking/poll-order';
import { TrpcFetcher } from './trpc/trpc-fetch';
import type { Logger, OrderStatusUpdate } from './types';
import { noopLogger } from './utils/logger';

export type CommandeClientOptions = {
  readonly baseUrl?: string;
  readonly logger?: Logger;
  readonly fetchImpl?: typeof fetch;
  readonly defaultHeaders?: Readonly<Record<string, string>>;
};

const DEFAULT_BASE_URL = 'https://commande.app';

export class CommandeClient {
  readonly restaurant: RestaurantResource;
  readonly menu: MenuResource;
  readonly order: OrderResource;
  readonly delivery: DeliveryResource;
  readonly payment: PaymentResource;
  readonly user: UserResource;
  readonly tracking: {
    pollOrder(opts: PollOrderOptions): AsyncIterable<OrderStatusUpdate>;
  };

  private readonly logger: Logger;

  constructor(options: CommandeClientOptions = {}) {
    this.logger = options.logger ?? noopLogger;
    const trpc = new TrpcFetcher({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      logger: this.logger,
      fetchImpl: options.fetchImpl,
      defaultHeaders: options.defaultHeaders,
    });

    this.restaurant = new RestaurantResource(trpc);
    this.menu = new MenuResource(trpc);
    this.order = new OrderResource(trpc);
    this.delivery = new DeliveryResource(trpc);
    this.payment = new PaymentResource(trpc);
    this.user = new UserResource(trpc);

    const orderResource = this.order;
    const logger = this.logger;
    this.tracking = {
      pollOrder(opts: PollOrderOptions): AsyncIterable<OrderStatusUpdate> {
        return pollOrder(opts, { order: orderResource, logger });
      },
    };
  }
}
