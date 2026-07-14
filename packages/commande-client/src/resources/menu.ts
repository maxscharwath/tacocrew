import { ValidationError } from '../errors';
import { combinationListSchema, menuItemsRawSchema, normalizeMenuItems } from '../schemas/menu.schema';
import type { TrpcFetcher } from '../trpc/trpc-fetch';
import type { Combination, Product } from '../types';

export type CallOpts = {
  readonly signal?: AbortSignal;
};

export type GetMenuItemsResult = {
  readonly products: readonly Product[];
};

export class MenuResource {
  constructor(private readonly trpc: TrpcFetcher) {}

  async getMenuItems(
    input: { readonly restaurantId: string; readonly serviceType?: string },
    opts: CallOpts = {}
  ): Promise<GetMenuItemsResult> {
    const raw = await this.trpc.query('menu.getMenuItems', input, opts);
    const result = menuItemsRawSchema.safeParse(raw);
    if (!result.success) {
      throw new ValidationError(`menu.getMenuItems parse failed: ${result.error.message}`, {
        cause: result.error,
      });
    }
    return normalizeMenuItems(result.data);
  }

  async getCombinations(
    input: { readonly restaurantId: string },
    opts: CallOpts = {}
  ): Promise<readonly Combination[]> {
    const raw = await this.trpc.query('menuCombination.getPublicByRestaurant', input, opts);
    const result = combinationListSchema.safeParse(raw);
    if (!result.success) {
      throw new ValidationError(
        `menuCombination.getPublicByRestaurant parse failed: ${result.error.message}`,
        { cause: result.error }
      );
    }
    return result.data;
  }
}
