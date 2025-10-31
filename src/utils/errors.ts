/**
 * Custom error classes
 * @module utils/errors
 */

import { ErrorCode } from '../types';

/**
 * Base API error class
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * CSRF token error
 */
export class CsrfError extends ApiError {
  constructor(message = 'CSRF token is invalid or expired') {
    super(ErrorCode.CSRF_INVALID, message, 403);
    this.name = 'CsrfError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded') {
    super(ErrorCode.RATE_LIMIT, message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Duplicate order error
 */
export class DuplicateOrderError extends ApiError {
  constructor(message = 'Order already exists') {
    super(ErrorCode.DUPLICATE_ORDER, message, 409);
    this.name = 'DuplicateOrderError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Out of stock error
 */
export class OutOfStockError extends ApiError {
  constructor(message = 'Product is out of stock', details?: Record<string, unknown>) {
    super(ErrorCode.OUT_OF_STOCK, message, 400, details);
    this.name = 'OutOfStockError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(ErrorCode.NOT_FOUND, message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Network error
 */
export class NetworkError extends ApiError {
  constructor(message = 'Network request failed', details?: Record<string, unknown>) {
    super(ErrorCode.NETWORK_ERROR, message, 502, details);
    this.name = 'NetworkError';
  }
}
