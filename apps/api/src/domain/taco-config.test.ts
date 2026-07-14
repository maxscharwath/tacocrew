/**
 * Tests for the canonical taco-domain module.
 */

import { describe, expect, test as it } from 'bun:test';
import type { OptionGroup, Product } from '@tacocrew/commande-client';
import {
  classifyOptionGroup,
  classifyProductCategory,
  classifyTacoSize,
  mapOptionGroupToGarnitures,
  mapOptionGroupToMeats,
  mapOptionGroupToSauces,
  mapProductToTaco,
  type SelectedOption,
  TACO_SIZE_CONFIG,
  TacoSize,
} from '@/domain/taco-config';

const buildGroup = (
  overrides: Partial<OptionGroup> & Pick<OptionGroup, 'id' | 'name' | 'options'>
): OptionGroup => ({
  minSelection: 0,
  maxSelection: 10,
  ...overrides,
});

const buildProduct = (
  overrides: Partial<Product> & Pick<Product, 'id' | 'name' | 'optionGroups'>
): Product => ({
  price: 0,
  available: true,
  variants: [],
  ...overrides,
});

describe('taco-config: TACO_SIZE_CONFIG', () => {
  it('contains all six sizes with the expected prices', () => {
    expect(TACO_SIZE_CONFIG[TacoSize.L].price).toBe(11);
    expect(TACO_SIZE_CONFIG[TacoSize.BOWL].price).toBe(14);
    expect(TACO_SIZE_CONFIG[TacoSize.L_MIXTE].price).toBe(12);
    expect(TACO_SIZE_CONFIG[TacoSize.XL].price).toBe(18.5);
    expect(TACO_SIZE_CONFIG[TacoSize.XXL].price).toBe(28);
    expect(TACO_SIZE_CONFIG[TacoSize.GIGA].price).toBe(38);
  });

  it('covers every TacoSize enum member', () => {
    const keys = Object.values(TacoSize);
    expect(keys.length).toBe(6);
    for (const key of keys) {
      expect(TACO_SIZE_CONFIG[key]).toBeDefined();
    }
  });
});

describe('taco-config: classifyTacoSize', () => {
  it('identifies each of the six sizes from plausible product names', () => {
    expect(classifyTacoSize('Tacos L')).toBe(TacoSize.L);
    expect(classifyTacoSize('Tacos L mixte')).toBe(TacoSize.L_MIXTE);
    expect(classifyTacoSize('Tacos Bowl')).toBe(TacoSize.BOWL);
    expect(classifyTacoSize('Tacos XL')).toBe(TacoSize.XL);
    expect(classifyTacoSize('Tacos XXL')).toBe(TacoSize.XXL);
    expect(classifyTacoSize('Tacos GIGA')).toBe(TacoSize.GIGA);
  });

  it('returns undefined for names that do not describe a taco size', () => {
    expect(classifyTacoSize('Fries')).toBeUndefined();
    expect(classifyTacoSize('Coca-Cola')).toBeUndefined();
  });
});

describe('taco-config: classifyProductCategory', () => {
  it('classifies by commande.app category name, recovering items the name regex missed', () => {
    // These all failed the legacy name-pattern classifier and were dropped.
    expect(classifyProductCategory({ name: 'Falafel', categoryName: 'Snacks' })).toBe('extra');
    expect(classifyProductCategory({ name: 'Red Bull 25cl', categoryName: 'Boissons' })).toBe(
      'drink'
    );
    expect(classifyProductCategory({ name: 'Cheesecake', categoryName: 'Desserts' })).toBe(
      'dessert'
    );
    expect(
      classifyProductCategory({ name: 'Tasty Crousty Custom', categoryName: 'Tasty Crousty' })
    ).toBe('crousty');
  });

  it('treats the Tacos category as other (tacos are handled via classifyTacoSize)', () => {
    expect(classifyProductCategory({ name: 'Tacos L', categoryName: 'Tacos' })).toBe('other');
  });

  it('falls back to name heuristics when the category name is absent', () => {
    expect(classifyProductCategory('Coca-Cola 33cl')).toBe('drink');
    expect(classifyProductCategory({ name: 'Brownie', categoryName: null })).toBe('dessert');
    expect(classifyProductCategory('Portion de frites')).toBe('extra');
    expect(classifyProductCategory('Some mystery item')).toBe('other');
  });
});

describe('taco-config: classifyOptionGroup', () => {
  it('classifies groups by their display name', () => {
    expect(classifyOptionGroup(buildGroup({ id: 'g1', name: 'Viande', options: [] }))).toBe('meat');
    expect(classifyOptionGroup(buildGroup({ id: 'g2', name: 'Sauce', options: [] }))).toBe('sauce');
    expect(classifyOptionGroup(buildGroup({ id: 'g3', name: 'Garnitures', options: [] }))).toBe(
      'garniture'
    );
    expect(classifyOptionGroup(buildGroup({ id: 'g4', name: 'Topping', options: [] }))).toBe(
      'garniture'
    );
    expect(classifyOptionGroup(buildGroup({ id: 'g5', name: 'Dessert', options: [] }))).toBe(
      'other'
    );
  });
});

describe('taco-config: mapOptionGroupToMeats', () => {
  it('returns Meat[] with names/ids/quantities from the selection', () => {
    const group = buildGroup({
      id: 'meats',
      name: 'Viande',
      options: [
        { id: 'poulet', name: 'Poulet', extraPrice: 0 },
        { id: 'boeuf', name: 'Boeuf', extraPrice: 0 },
        { id: 'agneau', name: 'Agneau', extraPrice: 0 },
      ],
    });
    const selected: SelectedOption[] = [
      { groupId: 'meats', optionId: 'poulet', quantity: 2 },
      { groupId: 'meats', optionId: 'boeuf', quantity: 1 },
    ];

    const meats = mapOptionGroupToMeats(group, selected);

    expect(meats).toEqual([
      { id: 'poulet', name: 'Poulet', quantity: 2 },
      { id: 'boeuf', name: 'Boeuf', quantity: 1 },
    ]);
  });

  it('ignores selections referring to a different group or unknown option', () => {
    const group = buildGroup({
      id: 'meats',
      name: 'Viande',
      options: [{ id: 'poulet', name: 'Poulet', extraPrice: 0 }],
    });
    const meats = mapOptionGroupToMeats(group, [
      { groupId: 'other', optionId: 'poulet', quantity: 1 },
      { groupId: 'meats', optionId: 'inconnu', quantity: 1 },
    ]);

    expect(meats).toEqual([]);
  });
});

describe('taco-config: mapOptionGroupToSauces', () => {
  it('returns Sauce[] from the selection without quantity', () => {
    const group = buildGroup({
      id: 'sauces',
      name: 'Sauce',
      options: [
        { id: 'algerienne', name: 'Algerienne', extraPrice: 0 },
        { id: 'samurai', name: 'Samurai', extraPrice: 0 },
      ],
    });

    const sauces = mapOptionGroupToSauces(group, [
      { groupId: 'sauces', optionId: 'algerienne', quantity: 1 },
      { groupId: 'sauces', optionId: 'samurai', quantity: 1 },
    ]);

    expect(sauces).toEqual([
      { id: 'algerienne', name: 'Algerienne' },
      { id: 'samurai', name: 'Samurai' },
    ]);
  });
});

describe('taco-config: mapOptionGroupToGarnitures', () => {
  it('returns Garniture[] from the selection', () => {
    const group = buildGroup({
      id: 'garnitures',
      name: 'Garnitures',
      options: [
        { id: 'salade', name: 'Salade', extraPrice: 0 },
        { id: 'tomates', name: 'Tomates', extraPrice: 0 },
        { id: 'oignons', name: 'Oignons', extraPrice: 0 },
      ],
    });

    const garnitures = mapOptionGroupToGarnitures(group, [
      { groupId: 'garnitures', optionId: 'salade', quantity: 1 },
      { groupId: 'garnitures', optionId: 'oignons', quantity: 1 },
    ]);

    expect(garnitures).toEqual([
      { id: 'salade', name: 'Salade' },
      { id: 'oignons', name: 'Oignons' },
    ]);
  });
});

describe('taco-config: mapProductToTaco', () => {
  const buildTacosLProduct = (): Product =>
    buildProduct({
      id: 'prod-tacos-l',
      name: 'Tacos L',
      optionGroups: [
        buildGroup({
          id: 'viande',
          name: 'Viande',
          options: [
            { id: 'poulet', name: 'Poulet', extraPrice: 0 },
            { id: 'boeuf', name: 'Boeuf', extraPrice: 0 },
          ],
        }),
        buildGroup({
          id: 'sauce',
          name: 'Sauce',
          options: [
            { id: 'algerienne', name: 'Algerienne', extraPrice: 0 },
            { id: 'samurai', name: 'Samurai', extraPrice: 0 },
          ],
        }),
        buildGroup({
          id: 'garniture',
          name: 'Garnitures',
          options: [
            { id: 'salade', name: 'Salade', extraPrice: 0 },
            { id: 'tomates', name: 'Tomates', extraPrice: 0 },
          ],
        }),
      ],
    });

  it('builds a Taco with the resolved size, ingredients, and price', () => {
    const product = buildTacosLProduct();
    const taco = mapProductToTaco(product, [
      { groupId: 'viande', optionId: 'poulet', quantity: 1 },
      { groupId: 'sauce', optionId: 'algerienne', quantity: 1 },
      { groupId: 'sauce', optionId: 'samurai', quantity: 1 },
      { groupId: 'garniture', optionId: 'salade', quantity: 1 },
    ]);

    expect(taco.id).toBe('prod-tacos-l');
    expect(taco.size).toBe(TacoSize.L);
    expect(taco.meats).toEqual([{ id: 'poulet', name: 'Poulet', quantity: 1 }]);
    expect(taco.sauces).toEqual([
      { id: 'algerienne', name: 'Algerienne' },
      { id: 'samurai', name: 'Samurai' },
    ]);
    expect(taco.garnitures).toEqual([{ id: 'salade', name: 'Salade' }]);
    expect(taco.price).toBe(TACO_SIZE_CONFIG[TacoSize.L].price);
  });

  it('throws when the product name does not map to a taco size', () => {
    const product = buildProduct({
      id: 'prod-fries',
      name: 'Frites',
      optionGroups: [],
    });

    expect(() => mapProductToTaco(product, [])).toThrow(/does not map to a known TacoSize/);
  });
});
