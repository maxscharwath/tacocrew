import { describe, expect, test as it } from 'bun:test';
import { z } from 'zod';
import activeFixture from '../__fixtures__/order.getActivePreorders.pending.json';
import confirmationFixture from '../__fixtures__/order.getOrderConfirmation.json';
import statusFixture from '../__fixtures__/order.getRestaurantStatus.json';
import {
  activePreorderListSchema,
  createOrderResponseSchema,
  orderSchema,
  restaurantStatusSchema,
} from './order.schema';

describe('order schemas', () => {
  it('parses a getOrderConfirmation fixture', () => {
    const parsed = orderSchema.parse(confirmationFixture);
    expect(parsed.status).toBe('confirmed');
  });

  it('parses an active preorders fixture', () => {
    const parsed = activePreorderListSchema.parse(activeFixture);
    expect(parsed).toHaveLength(1);
  });

  it('parses a restaurant status fixture', () => {
    const parsed = restaurantStatusSchema.parse(statusFixture);
    expect(parsed.acceptingOrders).toBe(true);
  });

  it('rejects an order missing orderId', () => {
    const { orderId: _drop, ...rest } = confirmationFixture;
    expect(() => orderSchema.parse(rest)).toThrow(z.ZodError);
  });
});

describe('createOrderResponseSchema', () => {
  it('accepts the legacy shape with `orderId` and numeric total', () => {
    const parsed = createOrderResponseSchema.parse({
      orderId: 'cm-1',
      total: 16,
      paymentMethod: 'twint',
    });
    expect(parsed.orderId).toBe('cm-1');
    expect(parsed.total).toBe(16);
  });

  it('accepts the production shape: `id` instead of `orderId`, total as string', () => {
    const parsed = createOrderResponseSchema.parse({
      id: 'cmoconp6801uucm6h16mbqwlh',
      transactionId: null,
      total: '57',
      paymentMethod: 'twint',
    });
    expect(parsed.orderId).toBe('cmoconp6801uucm6h16mbqwlh');
    expect(parsed.total).toBe(57);
    expect(parsed.transactionId).toBeNull();
  });

  it('preserves transactionId when present', () => {
    const parsed = createOrderResponseSchema.parse({
      orderId: 'cm-1',
      transactionId: 'txn-42',
      total: '12.5',
    });
    expect(parsed.transactionId).toBe('txn-42');
    expect(parsed.total).toBe(12.5);
  });

  it('rejects when both orderId and id are missing', () => {
    expect(() =>
      createOrderResponseSchema.parse({ total: '57', paymentMethod: 'twint' })
    ).toThrow(z.ZodError);
  });

  it('rejects when total is a non-numeric string', () => {
    expect(() =>
      createOrderResponseSchema.parse({ id: 'cm-1', total: 'not-a-number' })
    ).toThrow(z.ZodError);
  });
});
