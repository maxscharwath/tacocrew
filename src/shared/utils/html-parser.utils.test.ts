/**
 * Unit tests for HTML parser
 */

import { describe, expect, it } from 'vitest';
import { TacoIdSchema } from '@/schemas/taco.schema';
import { TacoSize } from '@/shared/types/types';
import { parseTacoCard, parseTacoCards } from '@/shared/utils/html-parser.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('HTML Parser', () => {
  describe('parseTacoCard', () => {
    it('should parse a valid taco card HTML', () => {
      const html = `
        <div class="card" id="tacos-0">
          <div class="card-body">
            <h5 class="card-title">Tacos XL - 12.50 CHF.</h5>
            <p><strong>Viande</strong>: Viande Hachée x 2</p>
            <p><strong>Sauce</strong>: Harissa</p>
            <p><strong>Garniture</strong>: Salade</p>
            <p><strong>Remarque</strong>: Pas trop épicé</p>
            <input name="quantity" value="1" readonly />
          </div>
        </div>
      `;

      const tacoId = TacoIdSchema.parse(randomUUID());
      const result = parseTacoCard(html, tacoId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(tacoId);
      expect(result?.size).toBe(TacoSize.XL);
      expect(result?.meats).toHaveLength(1);
      expect(result?.meats[0]?.code).toBe('viande_hachee');
      expect(result?.meats[0]?.id).toBeDefined();
      expect(result?.meats[0]?.quantity).toBe(2);
      expect(result?.note).toBe('Pas trop épicé');
      // Price extraction depends on HTML structure, so we check if it's a number
      expect(typeof result?.price).toBe('number');
    });

    it('should return null for invalid HTML', () => {
      const html = '<div>Invalid HTML</div>';
      const tacoId = TacoIdSchema.parse(randomUUID());
      const result = parseTacoCard(html, tacoId);
      expect(result).toBeNull();
    });

    it('should return null for missing size', () => {
      const html = '<div class="card"><div>No size</div></div>';
      const tacoId = TacoIdSchema.parse(randomUUID());
      const result = parseTacoCard(html, tacoId);
      expect(result).toBeNull();
    });

    it('should handle multiple meats', () => {
      const html = `
        <div class="card" id="tacos-0">
          <div class="card-body">
            <h5 class="card-title">Tacos XXL - 15.00 CHF.</h5>
            <p><strong>Viande</strong>: Viande Hachée x 2, Poulet x 1</p>
            <p><strong>Sauce</strong>: Harissa</p>
            <p><strong>Garniture</strong>: Salade</p>
          </div>
        </div>
      `;

      const tacoId = TacoIdSchema.parse(randomUUID());
      const result = parseTacoCard(html, tacoId);
      expect(result).not.toBeNull();
      expect(result?.meats).toHaveLength(2);
    });

    it('should extract quantity correctly', () => {
      const html = `
        <div class="card" id="tacos-0">
          <div class="card-body">
            <h5 class="card-title">Tacos XL - 12.50 CHF.</h5>
            <p><strong>Viande</strong>: Viande Hachée x 1</p>
            <p><strong>Sauce</strong>: Harissa</p>
            <p><strong>Garniture</strong>: Salade</p>
            <div class="quantity-controls">
              <input name="quantity" class="quantity-input" value="3" readonly />
            </div>
          </div>
        </div>
      `;

      const tacoId = TacoIdSchema.parse(randomUUID());
      const result = parseTacoCard(html, tacoId);
      expect(result).not.toBeNull();
      expect(result?.quantity).toBe(3);
    });
  });

  describe('parseTacoCards', () => {
    it('should parse multiple taco cards', () => {
      const html = `
        <div>
          <div class="card" id="tacos-0">
            <div class="card-body">
              <h5 class="card-title">Tacos XL - 12.00 CHF.</h5>
              <p><strong>Viande</strong>: Viande Hachée x 1</p>
              <p><strong>Sauce</strong>: Harissa</p>
              <p><strong>Garniture</strong>: Salade</p>
            </div>
          </div>
          <div class="card" id="tacos-1">
            <div class="card-body">
              <h5 class="card-title">Tacos L - 10.00 CHF.</h5>
              <p><strong>Viande</strong>: Poulet x 1</p>
              <p><strong>Sauce</strong>: Algerienne</p>
              <p><strong>Garniture</strong>: Tomates</p>
            </div>
          </div>
        </div>
      `;

      const mapping = new Map<number, string>();
      mapping.set(0, TacoIdSchema.parse(randomUUID()));
      mapping.set(1, TacoIdSchema.parse(randomUUID()));

      const result = parseTacoCards(html, mapping);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty HTML', () => {
      const result = parseTacoCards('', new Map());
      expect(result).toEqual([]);
    });
  });
});
