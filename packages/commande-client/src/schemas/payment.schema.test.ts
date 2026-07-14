import { describe, expect, test as it } from 'bun:test';
import { z } from 'zod';
import fixture from '../__fixtures__/paymentSettings.getAvailableMethods.json';
import { paymentMethodsResponseSchema } from './payment.schema';

describe('paymentMethodsResponseSchema', () => {
  it('normalizes the real flag payload (2026-07 HAR capture) into methods', () => {
    // Fixture: stripe/twint-online off, cash + POS on.
    const parsed = paymentMethodsResponseSchema.parse(fixture);
    expect(parsed.methods).toEqual(['card', 'cash']);
    expect(parsed.cashEnabled).toBe(true);
    expect(parsed.stripeEnabled).toBe(false);
  });

  it('maps every enabled flag to its method', () => {
    const parsed = paymentMethodsResponseSchema.parse({
      stripeEnabled: true,
      twintOnlineEnabled: true,
      cashEnabled: true,
      posEnabled: true,
    });
    expect(parsed.methods).toEqual(['twint', 'stripe', 'card', 'cash']);
  });

  it('rejects the legacy invented shape', () => {
    expect(() => paymentMethodsResponseSchema.parse({ methods: ['twint'] })).toThrow(z.ZodError);
  });
});
