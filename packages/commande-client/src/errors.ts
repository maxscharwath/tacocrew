export type CommandeErrorCode =
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'RESTAURANT_CLOSED'
  | 'VALIDATION'
  | 'NETWORK'
  | 'UNKNOWN';

// Marker returned by the backend inside tRPC error `data.code` when a restaurant refuses orders.
export const RESTAURANT_CLOSED_MARKER = 'RESTAURANT_CLOSED';

export type CommandeErrorOptions = {
  readonly cause?: unknown;
  readonly bodyExcerpt?: string;
};

export class CommandeError extends Error {
  readonly code: CommandeErrorCode;
  readonly bodyExcerpt?: string;

  constructor(
    message: string,
    code: CommandeErrorCode = 'UNKNOWN',
    options: CommandeErrorOptions = {}
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'CommandeError';
    this.code = code;
    this.bodyExcerpt = options.bodyExcerpt;
  }
}

export class NotFoundError extends CommandeError {
  constructor(message = 'Resource not found', options: CommandeErrorOptions = {}) {
    super(message, 'NOT_FOUND', options);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends CommandeError {
  constructor(message = 'Rate limited by commande.app', options: CommandeErrorOptions = {}) {
    super(message, 'RATE_LIMIT', options);
    this.name = 'RateLimitError';
  }
}

export class RestaurantClosedError extends CommandeError {
  constructor(message = 'Restaurant is closed', options: CommandeErrorOptions = {}) {
    super(message, 'RESTAURANT_CLOSED', options);
    this.name = 'RestaurantClosedError';
  }
}

export class ValidationError extends CommandeError {
  constructor(message = 'Invalid request or response shape', options: CommandeErrorOptions = {}) {
    super(message, 'VALIDATION', options);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends CommandeError {
  constructor(message = 'Network failure', options: CommandeErrorOptions = {}) {
    super(message, 'NETWORK', options);
    this.name = 'NetworkError';
  }
}
