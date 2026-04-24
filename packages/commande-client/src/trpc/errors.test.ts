import { describe, expect, test as it } from 'bun:test';
import {
  CommandeError,
  NotFoundError,
  RateLimitError,
  RestaurantClosedError,
  ValidationError,
} from '../errors';
import { mapTrpcError } from './errors';

describe('mapTrpcError', () => {
  it('maps NOT_FOUND to NotFoundError', () => {
    const err = mapTrpcError({ message: 'missing', code: 'NOT_FOUND' });
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('maps TOO_MANY_REQUESTS to RateLimitError', () => {
    const err = mapTrpcError({ message: 'slow down', code: 'TOO_MANY_REQUESTS' });
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.code).toBe('RATE_LIMIT');
  });

  it('maps BAD_REQUEST to ValidationError', () => {
    const err = mapTrpcError({ message: 'bad', code: 'BAD_REQUEST' });
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.code).toBe('VALIDATION');
  });

  it('maps PARSE_ERROR to ValidationError', () => {
    const err = mapTrpcError({ message: 'parse', code: 'PARSE_ERROR' });
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('maps RESTAURANT_CLOSED data.code to RestaurantClosedError regardless of tRPC code', () => {
    const err = mapTrpcError({
      message: 'closed',
      code: 'BAD_REQUEST',
      data: { code: 'RESTAURANT_CLOSED' },
    });
    expect(err).toBeInstanceOf(RestaurantClosedError);
    expect(err.code).toBe('RESTAURANT_CLOSED');
  });

  it('falls back to base CommandeError for unknown codes', () => {
    const err = mapTrpcError({ message: 'mystery', code: 'INTERNAL_SERVER_ERROR' });
    expect(err).toBeInstanceOf(CommandeError);
    expect(err).not.toBeInstanceOf(NotFoundError);
    expect(err.code).toBe('UNKNOWN');
  });

  it('forwards bodyExcerpt', () => {
    const err = mapTrpcError({ message: 'm', code: 'NOT_FOUND' }, 'snippet');
    expect(err.bodyExcerpt).toBe('snippet');
  });
});
