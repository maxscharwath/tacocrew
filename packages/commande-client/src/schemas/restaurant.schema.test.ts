import { describe, expect, test as it } from 'bun:test';
import { z } from 'zod';
import fixture from '../__fixtures__/restaurant.getBySlug.json';
import { restaurantSchema } from './restaurant.schema';

describe('restaurantSchema', () => {
  it('parses the fixture', () => {
    expect(() => restaurantSchema.parse(fixture)).not.toThrow();
  });

  it('rejects when required fields are missing', () => {
    const { name: _unused, ...rest } = fixture;
    expect(() => restaurantSchema.parse(rest)).toThrow(z.ZodError);
  });
});
