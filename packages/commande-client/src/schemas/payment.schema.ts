import { z } from 'zod';
import type { PaymentMethod, PaymentMethodsResponse } from '../types';

// Real `paymentSettings.getAvailableMethods` payload (captured 2026-07 via
// HAR) is a set of feature flags, not a method list:
// { stripeEnabled, twintOnlineEnabled, cashEnabled, posEnabled }.
// Normalize into a `methods` array while keeping the raw flags available.
export const paymentMethodsResponseSchema = z
  .object({
    stripeEnabled: z.boolean(),
    twintOnlineEnabled: z.boolean(),
    cashEnabled: z.boolean(),
    posEnabled: z.boolean(),
  })
  .passthrough()
  .transform((raw): PaymentMethodsResponse => {
    const methods: PaymentMethod[] = [];
    if (raw.twintOnlineEnabled) methods.push('twint');
    if (raw.stripeEnabled) methods.push('stripe');
    if (raw.posEnabled) methods.push('card');
    if (raw.cashEnabled) methods.push('cash');
    return {
      methods,
      stripeEnabled: raw.stripeEnabled,
      twintOnlineEnabled: raw.twintOnlineEnabled,
      cashEnabled: raw.cashEnabled,
      posEnabled: raw.posEnabled,
    };
  });
