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
  it('parses the real getOrderConfirmation payload (2026-07 HAR capture)', () => {
    const parsed = orderSchema.parse(confirmationFixture);
    expect(parsed.orderId).toBe('cmrepdzqe05uydd6hocs6uc09');
    expect(parsed.status).toBe('printed');
    expect(parsed.serviceType).toBe('delivery');
    // Prisma Decimal strings must arrive as numbers.
    expect(parsed.totalAmount).toBe(61);
    expect(parsed.deliveryFee).toBe(2);
    expect(parsed.items).toHaveLength(6);
    const firstItem = parsed.items[0];
    if (!firstItem) throw new Error('missing item');
    expect(firstItem.price).toBe(4);
    // `productName` is null on the row but present on the nested product.
    expect(firstItem.productName).toBe('Portion de frites');
    expect(parsed.statusTimestamps?.confirmed).toBe('2026-07-10T08:58:24.278Z');
  });

  it('parses an active preorders fixture', () => {
    const parsed = activePreorderListSchema.parse(activeFixture);
    expect(parsed).toHaveLength(1);
  });

  it('parses a restaurant status fixture', () => {
    const parsed = restaurantStatusSchema.parse(statusFixture);
    expect(parsed.acceptingOrders).toBe(true);
  });

  it('rejects an order missing both id and orderId', () => {
    const { id: _drop, ...rest } = confirmationFixture;
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
