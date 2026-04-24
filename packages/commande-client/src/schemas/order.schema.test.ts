import { describe, expect, test as it } from 'bun:test';
import { z } from 'zod';
import activeFixture from '../__fixtures__/order.getActivePreorders.pending.json';
import confirmationFixture from '../__fixtures__/order.getOrderConfirmation.json';
import statusFixture from '../__fixtures__/order.getRestaurantStatus.json';
import {
  activePreorderListSchema,
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
