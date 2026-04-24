import { describe, expect, test as it } from 'bun:test';
import { z } from 'zod';
import fixture from '../__fixtures__/menu.getMenuItems.json';
import { menuItemsRawSchema, normalizeMenuItems } from './menu.schema';

describe('menuItemsRawSchema', () => {
  it('parses the raw commande.app category-array fixture', () => {
    const result = menuItemsRawSchema.parse(fixture);
    expect(result).toHaveLength(1);
    expect(result[0]?.products).toHaveLength(1);
  });

  it('rejects when a category is missing required fields', () => {
    const bad = [{ id: 'x' }];
    expect(() => menuItemsRawSchema.parse(bad)).toThrow(z.ZodError);
  });
});

describe('normalizeMenuItems', () => {
  it('flattens categories into a typed product list', () => {
    const raw = menuItemsRawSchema.parse(fixture);
    const { products } = normalizeMenuItems(raw);
    expect(products).toHaveLength(1);
    const first = products[0];
    if (!first) throw new Error('missing product');
    expect(first.imageUrl).toBe(
      'https://commande.app/uploads/products/1776718615649-fd29d26d37b70e45.jpg'
    );
    expect(first.price).toBe(14);
    expect(first.available).toBe(true);
    expect(first.categoryName).toBe('Tacos');
    expect(first.optionGroups).toHaveLength(2);
    expect(first.optionGroups[0]?.options[0]?.available).toBe(true);
  });
});
