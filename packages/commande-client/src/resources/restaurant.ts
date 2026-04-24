import { ValidationError } from '../errors';
import { restaurantListSchema, restaurantSchema } from '../schemas/restaurant.schema';
import type { TrpcFetcher } from '../trpc/trpc-fetch';
import type { Restaurant } from '../types';

export type CallOpts = {
  readonly signal?: AbortSignal;
};

function parseOne(data: unknown): Restaurant {
  const result = restaurantSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(`restaurant parse failed: ${result.error.message}`, {
      cause: result.error,
    });
  }
  return result.data;
}

function parseList(data: unknown): readonly Restaurant[] {
  const result = restaurantListSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(`restaurant list parse failed: ${result.error.message}`, {
      cause: result.error,
    });
  }
  return result.data;
}

export class RestaurantResource {
  constructor(private readonly trpc: TrpcFetcher) {}

  async getAllPublic(opts: CallOpts = {}): Promise<readonly Restaurant[]> {
    const raw = await this.trpc.query('settings.getAllRestaurantsPublic', {}, opts);
    return parseList(raw);
  }

  async getBySlug(input: { readonly slug: string }, opts: CallOpts = {}): Promise<Restaurant> {
    const raw = await this.trpc.query('restaurant.getBySlug', input, opts);
    return parseOne(raw);
  }

  async getById(
    input: { readonly restaurantId: string },
    opts: CallOpts = {}
  ): Promise<Restaurant> {
    const raw = await this.trpc.query('settings.getRestaurantById', input, opts);
    return parseOne(raw);
  }
}
