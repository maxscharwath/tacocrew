import { ValidationError } from '../errors';
import {
  activePreorderListSchema,
  createOrderResponseSchema,
  orderSchema,
  potentialOrderResultSchema,
  restaurantStatusSchema,
} from '../schemas/order.schema';
import type { TrpcFetcher } from '../trpc/trpc-fetch';
import type {
  ActivePreorder,
  CreateOrderInput,
  CreateOrderResponse,
  OrderConfirmation,
  PotentialOrderResult,
  RestaurantStatus,
  ServiceType,
} from '../types';

export type CallOpts = {
  readonly signal?: AbortSignal;
};

function parseOrThrow<T>(
  schema: { safeParse(v: unknown): { success: true; data: T } | { success: false; error: Error } },
  raw: unknown,
  label: string
): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(`${label} parse failed: ${result.error.message}`, {
      cause: result.error,
    });
  }
  return result.data;
}

export type PotentialCreateInput = {
  readonly restaurantId: string;
  readonly serviceType: ServiceType;
  /** commande.app requires a v4 UUID. */
  readonly sessionId: string;
  readonly postalCode: string;
  readonly items?: CreateOrderInput['items'];
  readonly total?: number;
};

export class OrderResource {
  constructor(private readonly trpc: TrpcFetcher) {}

  async create(input: CreateOrderInput, opts: CallOpts = {}): Promise<CreateOrderResponse> {
    const raw = await this.trpc.mutation('order.create', input, opts);
    return parseOrThrow(createOrderResponseSchema, raw, 'order.create');
  }

  async getOrderConfirmation(
    input: { readonly orderId: string },
    opts: CallOpts = {}
  ): Promise<OrderConfirmation> {
    const raw = await this.trpc.query('order.getOrderConfirmation', input, opts);
    return parseOrThrow(orderSchema, raw, 'order.getOrderConfirmation');
  }

  async getActivePreorders(
    input: { readonly restaurantId: string },
    opts: CallOpts = {}
  ): Promise<readonly ActivePreorder[]> {
    const raw = await this.trpc.query('order.getActivePreorders', input, opts);
    return parseOrThrow(activePreorderListSchema, raw, 'order.getActivePreorders');
  }

  async getRestaurantStatus(
    input: { readonly restaurantId: string; readonly serviceType?: ServiceType },
    opts: CallOpts = {}
  ): Promise<RestaurantStatus> {
    const raw = await this.trpc.query('order.getRestaurantStatus', input, opts);
    return parseOrThrow(restaurantStatusSchema, raw, 'order.getRestaurantStatus');
  }

  async potentialCreate(
    input: PotentialCreateInput,
    opts: CallOpts = {}
  ): Promise<PotentialOrderResult> {
    const raw = await this.trpc.mutation('potentialOrder.create', input, opts);
    return parseOrThrow(potentialOrderResultSchema, raw, 'potentialOrder.create');
  }
}
