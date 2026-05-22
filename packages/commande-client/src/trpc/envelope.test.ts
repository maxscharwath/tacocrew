import { describe, expect, test as it } from 'bun:test';
import { ValidationError } from '../errors';
import { encodeInput, encodeInputParam, extractError, unwrapResponse } from './envelope';

describe('envelope', () => {
  describe('encodeInput', () => {
    it('wraps input in batch/json shape', () => {
      const wrapped = encodeInput({ restaurantId: 'abc' });
      expect(wrapped).toEqual({ 0: { json: { restaurantId: 'abc' } } });
    });

    it('emits superjson Date meta for Date instances', () => {
      const pickupTime = new Date('2026-04-24T09:50:00.000Z');
      const wrapped = encodeInput({ restaurantId: 'abc', pickupTime });
      expect(wrapped).toEqual({
        0: {
          json: { restaurantId: 'abc', pickupTime: '2026-04-24T09:50:00.000Z' },
          meta: { values: { pickupTime: ['Date'] } },
        },
      });
    });

    it('records nested Date paths with dot notation', () => {
      const wrapped = encodeInput({
        items: [{ when: new Date('2026-04-24T09:50:00.000Z') }],
      });
      expect(wrapped).toEqual({
        0: {
          json: { items: [{ when: '2026-04-24T09:50:00.000Z' }] },
          meta: { values: { 'items.0.when': ['Date'] } },
        },
      });
    });
  });

  describe('encodeInputParam', () => {
    it('URL-encodes the JSON-stringified batch payload', () => {
      const encoded = encodeInputParam({ slug: 'giga-tacos' });
      expect(encoded).toBe(encodeURIComponent('{"0":{"json":{"slug":"giga-tacos"}}}'));
      const decoded = JSON.parse(decodeURIComponent(encoded));
      expect(decoded).toEqual({ 0: { json: { slug: 'giga-tacos' } } });
    });
  });

  describe('unwrapResponse', () => {
    it('unwraps the inner json payload from a single-procedure batch', () => {
      const payload = [{ result: { data: { json: { orderId: 'o1' } } } }];
      expect(unwrapResponse(payload)).toEqual({ orderId: 'o1' });
    });

    it('rejects empty array', () => {
      expect(() => unwrapResponse([])).toThrow(ValidationError);
    });

    it('rejects missing result', () => {
      expect(() => unwrapResponse([{}])).toThrow(ValidationError);
    });

    it('rejects missing json field', () => {
      expect(() => unwrapResponse([{ result: { data: {} } }])).toThrow(ValidationError);
    });

    it('rejects error envelope as success', () => {
      const payload = [{ error: { message: 'boom' } }];
      expect(() => unwrapResponse(payload)).toThrow(ValidationError);
    });
  });

  describe('extractError', () => {
    it('returns null for non-error envelopes', () => {
      expect(extractError([{ result: { data: { json: {} } } }])).toBeNull();
      expect(extractError([])).toBeNull();
      expect(extractError(null)).toBeNull();
    });

    it('extracts error shape', () => {
      const payload = [
        {
          error: {
            message: 'Not found',
            code: 'NOT_FOUND',
            data: { code: 'NOT_FOUND', httpStatus: 404 },
          },
        },
      ];
      expect(extractError(payload)).toEqual({
        message: 'Not found',
        code: 'NOT_FOUND',
        data: { code: 'NOT_FOUND', httpStatus: 404 },
      });
    });
  });
});
