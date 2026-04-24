import { describe, expect, test as it } from 'bun:test';
import { z } from 'zod';
import fixture from '../__fixtures__/user.checkSmsRequirementPublic.json';
import { smsRequirementSchema } from './user.schema';

describe('smsRequirementSchema', () => {
  it('parses the fixture', () => {
    const parsed = smsRequirementSchema.parse(fixture);
    expect(parsed.required).toBe(false);
  });

  it('rejects payload without required field', () => {
    expect(() => smsRequirementSchema.parse({})).toThrow(z.ZodError);
  });
});
