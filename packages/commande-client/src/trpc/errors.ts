import {
  CommandeError,
  type CommandeErrorOptions,
  NotFoundError,
  RateLimitError,
  RESTAURANT_CLOSED_MARKER,
  RestaurantClosedError,
  ValidationError,
} from '../errors';
import type { TrpcErrorShape } from './envelope';

export function mapTrpcError(shape: TrpcErrorShape, bodyExcerpt?: string): CommandeError {
  const options: CommandeErrorOptions = { bodyExcerpt };
  const dataCode = shape.data?.code;
  if (dataCode === RESTAURANT_CLOSED_MARKER) {
    return new RestaurantClosedError(shape.message, options);
  }
  // The tRPC string code ("NOT_FOUND", "BAD_REQUEST", …) lives in `data.code`;
  // the top-level `code` is the numeric JSON-RPC code (e.g. -32600). Prefer
  // the string one, falling back to a top-level string code for older shapes.
  const code = dataCode ?? (typeof shape.code === 'string' ? shape.code : undefined);
  switch (code) {
    case 'NOT_FOUND':
      return new NotFoundError(shape.message, options);
    case 'TOO_MANY_REQUESTS':
      return new RateLimitError(shape.message, options);
    case 'BAD_REQUEST':
    case 'PARSE_ERROR':
    case 'UNPROCESSABLE_CONTENT':
      return new ValidationError(shape.message, options);
    default:
      return new CommandeError(shape.message, 'UNKNOWN', options);
  }
}
