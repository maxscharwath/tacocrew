import { describe, expect, test as it } from 'bun:test';
import type { Crousty } from '@/schemas/crousty.schema';
import { GroupOrderId } from '@/schemas/group-order.schema';
import { UserId } from '@/schemas/user.schema';
import type { UserOrderItems } from '@/shared/types/types';
import { isUserOrderEmpty, type UserOrder, UserOrderId } from './user-order.schema';

function orderWith(items: UserOrderItems): UserOrder {
  return {
    id: UserOrderId.parse('10000000-1000-4000-8000-100000000001'),
    groupOrderId: GroupOrderId.parse('10000000-1000-4000-8000-100000000002'),
    userId: UserId.parse('10000000-1000-4000-8000-100000000003'),
    items,
    reimbursement: { settled: false },
    participantPayment: { paid: false },
    createdAt: new Date('2026-07-14T00:00:00Z'),
    updatedAt: new Date('2026-07-14T00:00:00Z'),
  };
}

const noItems: UserOrderItems = { tacos: [], extras: [], drinks: [], desserts: [] };

describe('isUserOrderEmpty', () => {
  it('is true when there are no items at all', () => {
    expect(isUserOrderEmpty(orderWith(noItems))).toBe(true);
  });

  it('is false for a Crousty-only order (a crousty is a real item)', () => {
    const crousty: Crousty = {
      id: '10000000-1000-4000-8000-100000000009' as Crousty['id'],
      code: 'tasty_crousty_sweet',
      name: 'Tasty Crousty Sweet',
      variant: 'sweet',
      price: 18,
      quantity: 1,
      options: [],
    };
    expect(isUserOrderEmpty(orderWith({ ...noItems, crousties: [crousty] }))).toBe(false);
  });
});
