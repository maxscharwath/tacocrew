import { describe, expect, test as it } from 'bun:test';
import { z } from 'zod';
import fixture from '../__fixtures__/paymentSettings.getAvailableMethods.json';
import { paymentMethodsResponseSchema } from './payment.schema';

describe('paymentMethodsResponseSchema', () => {
  it('parses the fixture', () => {
    const parsed = paymentMethodsResponseSchema.parse(fixture);
    expect(parsed.methods).toContain('twint');
  });

  it('rejects an unknown payment method', () => {
    expect(() =>
      paymentMethodsResponseSchema.parse({ methods: ['bitcoin'] })
    ).toThrow(z.ZodError);
  });
});
