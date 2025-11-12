/**
 * Unit tests for validation schemas
 */

import { describe, expect, it } from 'vitest';
import { OrderType, TacoSize } from '../../shared/types/types';
import { schemas } from './validation.middleware';

describe('Validation Schemas', () => {
  describe('addTaco', () => {
    it('should validate a valid taco request', () => {
      const valid = {
        size: TacoSize.XL,
        meats: [{ id: 'viande_hachee', quantity: 2 }],
        sauces: ['harissa'],
        garnitures: ['salade'],
        note: 'Extra spicy',
      };

      const result = schemas.addTaco.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid size', () => {
      const invalid = {
        size: 'invalid_size',
        meats: [{ id: 'test', quantity: 1 }],
        sauces: [],
        garnitures: [],
      };

      const result = schemas.addTaco.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should require at least one meat', () => {
      const invalid = {
        size: TacoSize.XL,
        meats: [],
        sauces: ['harissa'],
        garnitures: [],
      };

      const result = schemas.addTaco.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should limit sauces to 3', () => {
      const invalid = {
        size: TacoSize.XL,
        meats: [{ id: 'test', quantity: 1 }],
        sauces: ['sauce1', 'sauce2', 'sauce3', 'sauce4'],
        garnitures: [],
      };

      const result = schemas.addTaco.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('updateTacoQuantity', () => {
    it('should validate increase action', () => {
      const result = schemas.updateTacoQuantity.safeParse({ action: 'increase' });
      expect(result.success).toBe(true);
    });

    it('should validate decrease action', () => {
      const result = schemas.updateTacoQuantity.safeParse({ action: 'decrease' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const result = schemas.updateTacoQuantity.safeParse({ action: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('createOrder', () => {
    it('should validate a valid order request', () => {
      const valid = {
        customer: {
          name: 'John Doe',
          phone: '+41791234567',
        },
        delivery: {
          type: OrderType.DELIVERY,
          address: '123 Test St',
          requestedFor: '15:00',
        },
      };

      const result = schemas.createOrder.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should require address for delivery orders', () => {
      const invalid = {
        customer: {
          name: 'John Doe',
          phone: '+41791234567',
        },
        delivery: {
          type: OrderType.DELIVERY,
          requestedFor: '15:00',
          // Missing address
        },
      };

      const result = schemas.createOrder.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should not require address for takeaway orders', () => {
      const valid = {
        customer: {
          name: 'John Doe',
          phone: '+41791234567',
        },
        delivery: {
          type: OrderType.TAKEAWAY,
          requestedFor: '15:00',
        },
      };

      const result = schemas.createOrder.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate phone number format', () => {
      const invalid = {
        customer: {
          name: 'John Doe',
          phone: 'invalid-phone',
        },
        delivery: {
          type: OrderType.TAKEAWAY,
          requestedFor: '15:00',
        },
      };

      const result = schemas.createOrder.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should validate requestedFor time format', () => {
      const invalid = {
        customer: {
          name: 'John Doe',
          phone: '+41791234567',
        },
        delivery: {
          type: OrderType.TAKEAWAY,
          requestedFor: 'invalid-time',
        },
      };

      const result = schemas.createOrder.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('addExtra', () => {
    it('should validate extra with required fields', () => {
      const valid = {
        id: 'extra-1',
        name: 'Frites',
        price: 3.5,
        quantity: 1,
      };

      const result = schemas.addExtra.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate extra with optional free_sauce', () => {
      const valid = {
        id: 'extra-1',
        name: 'Frites',
        price: 3.5,
        quantity: 1,
        free_sauce: {
          id: 'ketchup',
          name: 'Ketchup',
          price: 0,
        },
      };

      const result = schemas.addExtra.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
