import { ValidationError } from '../errors';
import { paymentMethodsResponseSchema } from '../schemas/payment.schema';
import type { TrpcFetcher } from '../trpc/trpc-fetch';
import type { PaymentMethodsResponse } from '../types';

export type CallOpts = {
  readonly signal?: AbortSignal;
};

export class PaymentResource {
  constructor(private readonly trpc: TrpcFetcher) {}

  async getAvailableMethods(
    input: { readonly restaurantId: string },
    opts: CallOpts = {}
  ): Promise<PaymentMethodsResponse> {
    const raw = await this.trpc.query('paymentSettings.getAvailableMethods', input, opts);
    const result = paymentMethodsResponseSchema.safeParse(raw);
    if (!result.success) {
      throw new ValidationError(
        `paymentSettings.getAvailableMethods parse failed: ${result.error.message}`,
        { cause: result.error }
      );
    }
    return result.data;
  }
}
