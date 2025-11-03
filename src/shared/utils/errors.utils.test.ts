/**
 * Unit tests for error classes
 */

import { describe, expect, it } from 'vitest';
import { ErrorCode } from '@/shared/types/types';
import {
  ApiError,
  CsrfError,
  DuplicateOrderError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from '@/shared/utils/errors.utils';

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create ApiError with default values', () => {
      const error = new ApiError(ErrorCode.UNKNOWN_ERROR, 'Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({});
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError with custom status and details', () => {
      const details = { field: 'value' };
      const error = new ApiError(ErrorCode.UNKNOWN_ERROR, 'Test error', 400, details);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with validation details', () => {
      const details = { field1: 'Error 1', field2: 'Error 2' };
      const error = new ValidationError('Validation failed', details);
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('CsrfError', () => {
    it('should create CsrfError with 403 status', () => {
      const error = new CsrfError('CSRF token invalid');
      expect(error.message).toBe('CSRF token invalid');
      expect(error.code).toBe(ErrorCode.CSRF_INVALID);
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('CsrfError');
    });
  });

  describe('RateLimitError', () => {
    it('should create RateLimitError with 429 status', () => {
      const error = new RateLimitError('Too many requests');
      expect(error.message).toBe('Too many requests');
      expect(error.code).toBe(ErrorCode.RATE_LIMIT);
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('RateLimitError');
    });
  });

  describe('DuplicateOrderError', () => {
    it('should create DuplicateOrderError with 409 status', () => {
      const error = new DuplicateOrderError('Order already exists');
      expect(error.message).toBe('Order already exists');
      expect(error.code).toBe(ErrorCode.DUPLICATE_ORDER);
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('DuplicateOrderError');
    });
  });

  describe('NetworkError', () => {
    it('should create NetworkError with 502 status', () => {
      const error = new NetworkError('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.statusCode).toBe(502); // NetworkError uses 502, not 503
      expect(error.name).toBe('NetworkError');
    });
  });
});
