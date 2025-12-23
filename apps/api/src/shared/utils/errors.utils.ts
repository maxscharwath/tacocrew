/**
 * Custom error classes
 * @module utils/errors
 */

import { ErrorCode, ErrorCodes } from '@/shared/types/types';
import { randomUUID } from '@/shared/utils/uuid.utils';

/**
 * Options for creating an ApiError
 */
export interface ApiErrorOptions {
  errorCode: (typeof ErrorCodes)[keyof typeof ErrorCodes];
  statusCode?: number;
  details?: Record<string, unknown>;
  key?: string;
}

/**
 * Base API error class
 */
export class ApiError extends Error {
  public readonly id: string;
  public readonly key: string;
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>;

  constructor(options: ApiErrorOptions) {
    super(options.errorCode.code);
    this.name = 'ApiError';
    this.id = randomUUID();
    this.code = options.errorCode.code;
    this.statusCode = options.statusCode ?? 500;
    this.details = options.details ?? {};
    this.key = options.key || options.errorCode.key;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * CSRF token error
 */
export class CsrfError extends ApiError {
  constructor() {
    super({
      errorCode: ErrorCodes.CSRF_INVALID,
      statusCode: 403,
    });
    this.name = 'CsrfError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends ApiError {
  constructor() {
    super({
      errorCode: ErrorCodes.RATE_LIMIT,
      statusCode: 429,
    });
    this.name = 'RateLimitError';
  }
}

/**
 * Duplicate order error
 */
export class DuplicateOrderError extends ApiError {
  constructor() {
    super({
      errorCode: ErrorCodes.DUPLICATE_ORDER,
      statusCode: 409,
    });
    this.name = 'DuplicateOrderError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends ApiError {
  constructor(details?: Record<string, unknown>, key?: string) {
    super({
      errorCode: ErrorCodes.VALIDATION_ERROR,
      statusCode: 400,
      details,
      key,
    });
    this.name = 'ValidationError';
  }
}

/**
 * Out of stock error
 */
export class OutOfStockError extends ApiError {
  constructor(details?: Record<string, unknown>) {
    super({
      errorCode: ErrorCodes.OUT_OF_STOCK,
      statusCode: 400,
      details,
    });
    this.name = 'OutOfStockError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends ApiError {
  constructor(details?: Record<string, unknown>) {
    // Normalize details to have consistent format: identifier + context
    const normalizedDetails = details ? NotFoundError.normalizeDetails(details) : undefined;

    super({
      errorCode: ErrorCodes.NOT_FOUND,
      statusCode: 404,
      details: normalizedDetails,
    });
    this.name = 'NotFoundError';
  }

  /**
   * Normalize details to have consistent identifier and context format
   */
  private static normalizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const { resource, id, tacoID, groupOrderId, ...rest } = details;

    // Determine identifier and context type (prefer specific types over generic id)
    const identifier = tacoID || id || groupOrderId;
    let context: string;
    if (tacoID) {
      context = 'tacoID';
    } else {
      context = 'id';
    }

    return {
      resource,
      identifier,
      context,
      ...rest, // Preserve any other details
    };
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends ApiError {
  constructor({ message }: { message?: string } = {}) {
    super({
      errorCode: ErrorCodes.FORBIDDEN,
      statusCode: 403,
    });
    this.name = 'ForbiddenError';

    // Override message if provided
    if (message) {
      this.message = message;
    }
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends ApiError {
  constructor(message?: string) {
    super({
      errorCode: ErrorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
    this.name = 'UnauthorizedError';

    // Override message if provided
    if (message) {
      this.message = message;
    }
  }
}

/**
 * Network error
 */
export class NetworkError extends ApiError {
  constructor(details?: Record<string, unknown>) {
    super({
      errorCode: ErrorCodes.NETWORK_ERROR,
      statusCode: 502,
      details,
    });
    this.name = 'NetworkError';
  }
}
