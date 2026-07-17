import { describe, expect, test as it } from 'bun:test';
import { createAmount, type StockAvailability, StockCategory } from '@/shared/types/types';
import { ItemProcessor } from './item-processor';

function stockWithCrousty(): StockAvailability {
  return {
    [StockCategory.Meats]: [],
    [StockCategory.Sauces]: [],
    [StockCategory.Garnishes]: [],
    [StockCategory.Desserts]: [],
    [StockCategory.Drinks]: [],
    [StockCategory.Extras]: [],
    tacos: [],
    crousties: [
      {
        id: 'prod-crousty-sweet',
        code: 'tasty_crousty_sweet',
        name: 'Tasty Crousty Sweet',
        price: createAmount(14),
        in_stock: true,
        variant: 'sweet',
        optionGroups: [
          {
            id: 'grp-taille',
            name: 'Taille',
            minSelection: 1,
            maxSelection: 1,
            options: [
              { id: 'opt-s', name: 'Taille S (500 ml)', in_stock: true },
              { id: 'opt-xl', name: 'Taille XL (850 ml)', price: createAmount(4), in_stock: true },
            ],
          },
        ],
      },
    ],
  };
}

describe('ItemProcessor.processCrousty', () => {
  it('adds selected option extra prices to the base price', () => {
    const result = ItemProcessor.processCrousty(
      {
        code: 'tasty_crousty_sweet',
        options: [{ groupName: 'Taille', optionName: 'Taille XL (850 ml)' }],
        quantity: 1,
      },
      stockWithCrousty()
    );
    // 14 base + 4 for Taille XL.
    expect(result.price).toBe(18);
    expect(result.name).toBe('Tasty Crousty Sweet');
    expect(result.variant).toBe('sweet');
    expect(result.options).toEqual([{ groupName: 'Taille', optionName: 'Taille XL (850 ml)' }]);
  });

  it('keeps the base price when the chosen option has no extra', () => {
    const result = ItemProcessor.processCrousty(
      {
        code: 'tasty_crousty_sweet',
        options: [{ groupName: 'Taille', optionName: 'Taille S (500 ml)' }],
        quantity: 1,
      },
      stockWithCrousty()
    );
    expect(result.price).toBe(14);
  });

  it('throws when a chosen option is not on the product', () => {
    expect(() =>
      ItemProcessor.processCrousty(
        {
          code: 'tasty_crousty_sweet',
          options: [{ groupName: 'Taille', optionName: 'Taille XXL (1300 ml)' }],
          quantity: 1,
        },
        stockWithCrousty()
      )
    ).toThrow();
  });
});
