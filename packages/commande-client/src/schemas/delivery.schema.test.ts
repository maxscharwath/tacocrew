import { describe, expect, test as it } from 'bun:test';
import { z } from 'zod';
import cityFixture from '../__fixtures__/delivery.getCityFromPostalCode.json';
import zoneFixture from '../__fixtures__/deliveryZone.getByPostalCode.json';
import { cityFromPostalCodeSchema, deliveryZoneSchema } from './delivery.schema';

describe('delivery schemas', () => {
  it('parses the real delivery zone payload (2026-07 HAR capture)', () => {
    const parsed = deliveryZoneSchema.parse(zoneFixture);
    expect(parsed.available).toBe(true);
    expect(parsed.fee).toBe(2);
    expect(parsed.postalCode).toBe('1007');
    expect(parsed.minOrderAmount).toBe(18);
    expect(parsed.minOrderMode).toBe('accept');
    expect(parsed.estimatedMinutes).toBeNull();
  });

  it('maps a closed zone to available: false', () => {
    const parsed = deliveryZoneSchema.parse({
      ...zoneFixture,
      isClosed: true,
      closureMessage: 'Fermé ce soir',
    });
    expect(parsed.available).toBe(false);
    expect(parsed.closureMessage).toBe('Fermé ce soir');
  });

  it('parses a city fixture and tolerates the missing postalCode', () => {
    const parsed = cityFromPostalCodeSchema.parse(cityFixture);
    expect(parsed.city).toBe('Lausanne');
  });

  it('rejects a zone missing postalCode', () => {
    const { postalCode: _drop, ...rest } = zoneFixture;
    expect(() => deliveryZoneSchema.parse(rest)).toThrow(z.ZodError);
  });
});
