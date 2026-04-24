import { describe, expect, test as it } from 'bun:test';
import { z } from 'zod';
import cityFixture from '../__fixtures__/delivery.getCityFromPostalCode.json';
import zoneFixture from '../__fixtures__/deliveryZone.getByPostalCode.json';
import { cityFromPostalCodeSchema, deliveryZoneSchema } from './delivery.schema';

describe('delivery schemas', () => {
  it('parses a delivery zone fixture', () => {
    const parsed = deliveryZoneSchema.parse(zoneFixture);
    expect(parsed.available).toBe(true);
  });

  it('parses a city fixture', () => {
    const parsed = cityFromPostalCodeSchema.parse(cityFixture);
    expect(parsed.city).toBe('Lausanne');
  });

  it('rejects a zone missing fee', () => {
    const { fee: _drop, ...rest } = zoneFixture;
    expect(() => deliveryZoneSchema.parse(rest)).toThrow(z.ZodError);
  });
});
