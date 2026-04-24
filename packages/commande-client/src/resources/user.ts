import { ValidationError } from '../errors';
import { smsRequirementSchema } from '../schemas/user.schema';
import type { TrpcFetcher } from '../trpc/trpc-fetch';
import type { SmsRequirement } from '../types';

export type CallOpts = {
  readonly signal?: AbortSignal;
};

export class UserResource {
  constructor(private readonly trpc: TrpcFetcher) {}

  async checkSmsRequirementPublic(
    input: { readonly restaurantId: string; readonly phone?: string },
    opts: CallOpts = {}
  ): Promise<SmsRequirement> {
    const raw = await this.trpc.query('user.checkSmsRequirementPublic', input, opts);
    const result = smsRequirementSchema.safeParse(raw);
    if (!result.success) {
      throw new ValidationError(
        `user.checkSmsRequirementPublic parse failed: ${result.error.message}`,
        { cause: result.error }
      );
    }
    return result.data;
  }
}
