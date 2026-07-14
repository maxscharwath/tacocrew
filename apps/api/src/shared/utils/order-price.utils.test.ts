import { describe, expect, test as it } from 'bun:test';
import type { Crousty } from '@/schemas/crousty.schema';
import type { UserOrderItems } from '@/shared/types/types';
import { calculateUserOrderPrice } from '@/shared/utils/order-price.utils';

const emptyItems: UserOrderItems = {
  tacos: [],
  extras: [],
  drinks: [],
  desserts: [],
};

describe('calculateUserOrderPrice', () => {
  it('includes Tasty Crousty lines (price × quantity) in the total', () => {
    const crousty: Crousty = {
      id: '00000000-0000-0000-0000-000000000001' as Crousty['id'],
      code: 'tasty_crousty_sweet',
      name: 'Tasty Crousty Sweet',
      variant: 'sweet',
      price: 18, // 14 base + 4 for Taille XL
      quantity: 2,
      options: [{ groupName: 'Taille', optionName: 'Taille XL (850 ml)' }],
    };
    const total = calculateUserOrderPrice({ ...emptyItems, crousties: [crousty] });
    expect(total).toBe(36);
  });

  it('sums crousties alongside other item types', () => {
    const items: UserOrderItems = {
      ...emptyItems,
      desserts: [
        {
          id: '00000000-0000-0000-0000-000000000002' as UserOrderItems['desserts'][number]['id'],
          code: 'brownie',
          name: 'Brownie',
          price: 13,
          quantity: 1,
        },
      ],
      crousties: [
        {
          id: '00000000-0000-0000-0000-000000000003' as Crousty['id'],
          code: 'tasty_crousty_sweet',
          name: 'Tasty Crousty Sweet',
          variant: 'sweet',
          price: 18,
          quantity: 1,
          options: [],
        },
      ],
    };
    // 13 (dessert) + 18 (crousty) — the bug reported it as 13.
    expect(calculateUserOrderPrice(items)).toBe(31);
  });

  it('treats a missing crousties field as no crousties (backward compatible)', () => {
    expect(calculateUserOrderPrice(emptyItems)).toBe(0);
  });
});
