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
  switch (shape.code) {
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
