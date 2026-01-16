/**
 * @tacocrew/errors - Shared error types for TacoCrew
 */

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCodes = {
  CSRF_INVALID: { code: 'CSRF_INVALID', key: 'errors.csrf.invalid' },
  RATE_LIMIT: { code: 'RATE_LIMIT', key: 'errors.rateLimit.exceeded' },
  DUPLICATE_ORDER: { code: 'DUPLICATE_ORDER', key: 'errors.order.duplicate' },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', key: 'errors.validation.failed' },
  OUT_OF_STOCK: { code: 'OUT_OF_STOCK', key: 'errors.stock.outOfStock' },
  NOT_FOUND: { code: 'NOT_FOUND', key: 'errors.notFound.generic' },
  NETWORK_ERROR: { code: 'NETWORK_ERROR', key: 'errors.network.failed' },
  SESSION_NOT_FOUND: { code: 'SESSION_NOT_FOUND', key: 'errors.session.notFound' },
  SESSION_EXPIRED: { code: 'SESSION_EXPIRED', key: 'errors.session.expired' },
  UNKNOWN_ERROR: { code: 'UNKNOWN_ERROR', key: 'errors.unknown.generic' },
  FORBIDDEN: { code: 'FORBIDDEN', key: 'errors.forbidden.generic' },
  ORGANIZATION_ACCESS_DENIED: { code: 'ORGANIZATION_ACCESS_DENIED', key: 'errors.organization.accessDenied' },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', key: 'errors.unauthorized.generic' },
  PASSKEY_NOT_FOUND: { code: 'PASSKEY_NOT_FOUND', key: 'errors.auth.passkey.notFound' },
  CHALLENGE_NOT_FOUND: { code: 'CHALLENGE_NOT_FOUND', key: 'errors.auth.passkey.challengeNotFound' },
  PASSKEY_REGISTRATION_NOT_ALLOWED: { code: 'YOU_ARE_NOT_ALLOWED_TO_REGISTER_THIS_PASSKEY', key: 'errors.auth.passkey.registrationNotAllowed' },
  PASSKEY_VERIFICATION_FAILED: { code: 'FAILED_TO_VERIFY_REGISTRATION', key: 'errors.auth.passkey.verificationFailed' },
  INVALID_EMAIL_OR_PASSWORD: { code: 'INVALID_EMAIL_OR_PASSWORD', key: 'errors.auth.invalidCredentials' },
  USER_NOT_FOUND: { code: 'USER_NOT_FOUND', key: 'errors.auth.userNotFound' },
  EMAIL_ALREADY_IN_USE: { code: 'EMAIL_ALREADY_IN_USE', key: 'errors.auth.emailInUse' },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', key: 'errors.auth.invalidToken' },
} as const;

export type ErrorCodeEntry = (typeof ErrorCodes)[keyof typeof ErrorCodes];
export type ErrorCode = ErrorCodeEntry['code'];

// ============================================================================
// Base Error Class
// ============================================================================

export class ApiError extends Error {
  readonly id: string;
  readonly code: string;
  readonly key: string;
  readonly statusCode: number;
  readonly details: Record<string, unknown>;

  constructor(
    errorCode: ErrorCodeEntry,
    statusCode: number,
    details: Record<string, unknown> = {}
  ) {
    super(errorCode.code);
    this.name = 'ApiError';
    this.id = crypto.randomUUID();
    this.code = errorCode.code;
    this.key = errorCode.key;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// ============================================================================
// Specific Errors
// ============================================================================

export class NotFoundError extends ApiError {
  constructor(details: Record<string, unknown> = {}) {
    super(ErrorCodes.NOT_FOUND, 404, details);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(options: { message?: string; details?: Record<string, unknown> } = {}) {
    super(ErrorCodes.FORBIDDEN, 403, options.details ?? {});
    this.name = 'ForbiddenError';
    if (options.message) this.message = options.message;
  }
}

export class OrganizationAccessError extends ApiError {
  constructor(organizationId: string) {
    super(ErrorCodes.ORGANIZATION_ACCESS_DENIED, 403, { organizationId });
    this.name = 'OrganizationAccessError';
  }

  get organizationId(): string {
    return this.details.organizationId as string;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message?: string) {
    super(ErrorCodes.UNAUTHORIZED, 401);
    this.name = 'UnauthorizedError';
    if (message) this.message = message;
  }
}

export class ValidationError extends ApiError {
  constructor(details: Record<string, unknown> = {}) {
    super(ErrorCodes.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends ApiError {
  constructor() {
    super(ErrorCodes.RATE_LIMIT, 429);
    this.name = 'RateLimitError';
  }
}

export class DuplicateOrderError extends ApiError {
  constructor() {
    super(ErrorCodes.DUPLICATE_ORDER, 409);
    this.name = 'DuplicateOrderError';
  }
}

export class OutOfStockError extends ApiError {
  constructor(details: Record<string, unknown> = {}) {
    super(ErrorCodes.OUT_OF_STOCK, 400, details);
    this.name = 'OutOfStockError';
  }
}

export class NetworkError extends ApiError {
  constructor(details: Record<string, unknown> = {}) {
    super(ErrorCodes.NETWORK_ERROR, 502, details);
    this.name = 'NetworkError';
  }
}

export class CsrfError extends ApiError {
  constructor() {
    super(ErrorCodes.CSRF_INVALID, 403);
    this.name = 'CsrfError';
  }
}

// ============================================================================
// Client-side Error Parsing
// ============================================================================

/**
 * Parse API response body and create typed error
 */
export function parseApiError(status: number, body: unknown): ApiError {
  const error = extractErrorInfo(body);
  const code = error?.code;
  const details = error?.details ?? {};

  // Match by error code first
  switch (code) {
    case ErrorCodes.ORGANIZATION_ACCESS_DENIED.code:
      if (typeof details.organizationId === 'string') {
        return new OrganizationAccessError(details.organizationId);
      }
      break;
    case ErrorCodes.NOT_FOUND.code:
      return new NotFoundError(details);
    case ErrorCodes.FORBIDDEN.code:
      return new ForbiddenError({ details });
    case ErrorCodes.UNAUTHORIZED.code:
      return new UnauthorizedError();
    case ErrorCodes.VALIDATION_ERROR.code:
      return new ValidationError(details);
    case ErrorCodes.RATE_LIMIT.code:
      return new RateLimitError();
    case ErrorCodes.OUT_OF_STOCK.code:
      return new OutOfStockError(details);
    case ErrorCodes.NETWORK_ERROR.code:
      return new NetworkError(details);
  }

  // Fallback by status code
  if (status === 404) return new NotFoundError(details);
  if (status === 403) return new ForbiddenError({ details });
  if (status === 401) return new UnauthorizedError();
  if (status === 429) return new RateLimitError();

  // Generic error
  return new ApiError(ErrorCodes.UNKNOWN_ERROR, status, details);
}

function extractErrorInfo(body: unknown): { code?: string; key?: string; details?: Record<string, unknown> } | null {
  if (!body || typeof body !== 'object') return null;

  const obj = body as Record<string, unknown>;
  const error = obj.error as Record<string, unknown> | undefined;
  if (!error || typeof error !== 'object') return null;

  return {
    code: typeof error.code === 'string' ? error.code : undefined,
    key: typeof error.key === 'string' ? error.key : undefined,
    details: error.details && typeof error.details === 'object' && !Array.isArray(error.details)
      ? error.details as Record<string, unknown>
      : undefined,
  };
}
