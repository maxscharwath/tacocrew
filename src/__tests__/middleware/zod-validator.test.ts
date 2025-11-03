/**
 * Unit tests for Zod validator middleware
 */

import type { Context, HonoRequest } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { zodValidator } from '@/hono/middleware/zod-validator';
import { ValidationError } from '@/utils/errors';

describe('zodValidator', () => {
  it('should validate request body successfully', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const validator = zodValidator(schema);

    const mockContext = {
      req: {
        json: vi.fn().mockResolvedValue({ name: 'John', age: 30 }),
      } as Partial<HonoRequest>,
      set: vi.fn(),
    } as unknown as Context;

    const next = vi.fn().mockResolvedValue(undefined);

    await validator(mockContext as Context, next);

    expect(mockContext.req.json).toHaveBeenCalled();
    expect(mockContext.set).toHaveBeenCalledWith('body', { name: 'John', age: 30 });
    expect(next).toHaveBeenCalled();
  });

  it('should throw ValidationError for invalid data', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const validator = zodValidator(schema);

    const mockContext = {
      req: {
        json: vi.fn().mockResolvedValue({ name: 'John', age: 'not-a-number' }),
      } as Partial<HonoRequest>,
      set: vi.fn(),
    } as unknown as Context;

    const next = vi.fn();

    await expect(validator(mockContext as Context, next)).rejects.toThrow(ValidationError);

    expect(next).not.toHaveBeenCalled();
  });

  it('should handle empty body gracefully', async () => {
    const schema = z.object({
      name: z.string().optional(),
    });

    const validator = zodValidator(schema);

    const mockContext = {
      req: {
        json: vi.fn().mockRejectedValue(new Error('Empty body')),
      } as Partial<HonoRequest>,
      set: vi.fn(),
    } as unknown as Context;

    const next = vi.fn().mockResolvedValue(undefined);

    // Should handle the error and still validate (empty object)
    await validator(mockContext as Context, next);

    expect(mockContext.set).toHaveBeenCalled();
  });

  it('should include validation details in error', async () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const validator = zodValidator(schema);

    const mockContext = {
      req: {
        json: vi.fn().mockResolvedValue({
          email: 'invalid-email',
          password: 'short',
        }),
      } as Partial<HonoRequest>,
      set: vi.fn(),
    } as unknown as Context;

    const next = vi.fn();

    try {
      await validator(mockContext as Context, next);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.details).toBeDefined();
      expect(Object.keys(validationError.details)).toHaveLength(2);
    }
  });
});
