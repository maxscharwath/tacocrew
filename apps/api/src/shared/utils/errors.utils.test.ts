/**
 * Unit tests for error classes
 */

import { describe, expect, it } from 'vitest';
import { ErrorCodes } from '@/shared/types/types';
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
      const error = new ApiError({
        errorCode: ErrorCodes.UNKNOWN_ERROR,
      });
      expect(error.message).toBe(ErrorCodes.UNKNOWN_ERROR.code);
      expect(error.code).toBe(ErrorCodes.UNKNOWN_ERROR.code);
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({});
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError with custom status and details', () => {
      const details = { field: 'value' };
      const error = new ApiError({
        errorCode: ErrorCodes.UNKNOWN_ERROR,
        statusCode: 400,
        details,
      });
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError();
      expect(error.code).toBe(ErrorCodes.NOT_FOUND.code);
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with validation details', () => {
      const details = { field1: 'Error 1', field2: 'Error 2' };
      const error = new ValidationError(details);
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR.code);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('CsrfError', () => {
    it('should create CsrfError with 403 status', () => {
      const error = new CsrfError();
      expect(error.code).toBe(ErrorCodes.CSRF_INVALID.code);
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('CsrfError');
    });
  });

  describe('RateLimitError', () => {
    it('should create RateLimitError with 429 status', () => {
      const error = new RateLimitError();
      expect(error.code).toBe(ErrorCodes.RATE_LIMIT.code);
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('RateLimitError');
    });
  });

  describe('DuplicateOrderError', () => {
    it('should create DuplicateOrderError with 409 status', () => {
      const error = new DuplicateOrderError();
      expect(error.code).toBe(ErrorCodes.DUPLICATE_ORDER.code);
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('DuplicateOrderError');
    });
  });

  describe('NetworkError', () => {
    it('should create NetworkError with 502 status', () => {
      const error = new NetworkError();
      expect(error.code).toBe(ErrorCodes.NETWORK_ERROR.code);
      expect(error.statusCode).toBe(502); // NetworkError uses 502, not 503
      expect(error.name).toBe('NetworkError');
    });
  });
});
