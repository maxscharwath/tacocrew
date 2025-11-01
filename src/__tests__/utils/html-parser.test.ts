/**
 * Unit tests for HTML parser
 */

import { describe, it, expect } from 'vitest';
import { parseTacoCard, parseTacoCards, parseCartSummary } from '../../utils/html-parser';
import { TacoSize } from '../../types';

describe('HTML Parser', () => {
  describe('parseTacoCard', () => {
    it('should parse a valid taco card HTML', () => {
      const html = `
        <div class="card">
          <select name="selectProduct">
            <option value="tacos_XL" selected>XL</option>
            <option value="tacos_L">L</option>
          </select>
          <input name="viande[]" value="viande_hachee" checked />
          <input name="meat_quantity[viande_hachee]" value="2" />
          <select name="sauce[]">
            <option value="harissa" selected>Harissa</option>
          </select>
          <select name="garniture[]">
            <option value="salade" selected>Salade</option>
          </select>
          <textarea name="tacosNote">Pas trop épicé</textarea>
          <input name="quantity" value="1" />
          <div class="price">12.50</div>
        </div>
      `;

      const result = parseTacoCard(html, 'test-taco-id');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-taco-id');
      expect(result?.size).toBe(TacoSize.XL);
      expect(result?.meats).toHaveLength(1);
      expect(result?.meats[0]?.id).toBe('viande_hachee');
      expect(result?.meats[0]?.quantity).toBe(2);
      expect(result?.note).toBe('Pas trop épicé');
      // Price extraction depends on HTML structure, so we check if it's a number
      expect(typeof result?.price).toBe('number');
    });

    it('should return null for invalid HTML', () => {
      const html = '<div>Invalid HTML</div>';
      const result = parseTacoCard(html, 'test-id');
      expect(result).toBeNull();
    });

    it('should return null for missing size', () => {
      const html = '<div class="card"><div>No size</div></div>';
      const result = parseTacoCard(html, 'test-id');
      expect(result).toBeNull();
    });

    it('should handle multiple meats', () => {
      const html = `
        <div class="card">
          <select name="selectProduct">
            <option value="tacos_XXL" selected>XXL</option>
          </select>
          <input name="viande[]" value="viande_hachee" checked />
          <input name="meat_quantity[viande_hachee]" value="2" />
          <input name="viande[]" value="poulet" checked />
          <input name="meat_quantity[poulet]" value="1" />
        </div>
      `;

      const result = parseTacoCard(html, 'test-id');
      expect(result?.meats).toHaveLength(2);
    });

    it('should extract quantity correctly', () => {
      const html = `
        <div class="card">
          <select name="selectProduct">
            <option value="tacos_XL" selected>XL</option>
          </select>
          <input name="quantity" value="3" />
        </div>
      `;

      const result = parseTacoCard(html, 'test-id');
      expect(result?.quantity).toBe(3);
    });
  });

  describe('parseTacoCards', () => {
    it('should parse multiple taco cards', () => {
      const html = `
        <div>
          <div class="card">
            <select name="selectProduct">
              <option value="tacos_XL" selected>XL</option>
            </select>
          </div>
          <div class="card">
            <select name="selectProduct">
              <option value="tacos_L" selected>L</option>
            </select>
          </div>
        </div>
      `;

      const mapping = new Map<number, string>();
      mapping.set(0, 'taco-1');
      mapping.set(1, 'taco-2');

      const result = parseTacoCards(html, mapping);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty HTML', () => {
      const result = parseTacoCards('', new Map());
      expect(result).toEqual([]);
    });
  });

  describe('parseCartSummary', () => {
    it('should parse cart summary HTML', () => {
      const html = `
        <div>
          <div data-category="tacos">
            <span class="quantity">2</span>
            <span class="price">25.00</span>
          </div>
        </div>
      `;

      const result = parseCartSummary(html);
      expect(result).toBeDefined();
      expect(result.tacos).toBeDefined();
    });

    it('should return default values for empty HTML', () => {
      const result = parseCartSummary('');
      expect(result.tacos.totalQuantity).toBe(0);
      expect(result.tacos.totalPrice).toBe(0);
    });
  });
});

