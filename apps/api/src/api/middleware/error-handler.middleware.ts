/**
 * Error handler for Hono
 * @module hono/middleware/error-handler
 */

import { CsrfError, NetworkError, RateLimitError } from '@tacobot/gigatacos-client';
import { Context, ErrorHandler } from 'hono';
import { ErrorCodes } from '../../shared/types/types';
import { ApiError, CsrfError as AppCsrfError } from '../../shared/utils/errors.utils';
import { logger } from '../../shared/utils/logger.utils';

/**
 * Global error handler for Hono
 */
export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  // Log the error
  logger.error('Request error', {
    method: c.req.method,
    url: c.req.url,
    error: err instanceof ApiError ? err.code : err.message,
    stack: err.stack,
  });

  // Handle ApiError
  if (err instanceof ApiError) {
    return c.json(
      {
        error: {
          id: err.id,
          code: err.code,
          key: err.key,
          details: err.details,
        },
      },
      err.statusCode as 200 | 400 | 401 | 403 | 404 | 409 | 429 | 500
    );
  }

  // Convert client errors to ApiError
  if (err instanceof CsrfError) {
    const apiError = new AppCsrfError();
    return c.json(
      {
        error: {
          id: apiError.id,
          code: apiError.code,
          key: apiError.key,
          details: apiError.details,
        },
      },
      apiError.statusCode as 200 | 400 | 401 | 403 | 404 | 409 | 429 | 500
    );
  }

  if (err instanceof RateLimitError) {
    const apiError = new ApiError({
      errorCode: ErrorCodes.RATE_LIMIT,
      statusCode: 429,
    });
    return c.json(
      {
        error: {
          id: apiError.id,
          code: apiError.code,
          key: apiError.key,
          details: apiError.details,
        },
      },
      429
    );
  }

  if (err instanceof NetworkError) {
    const apiError = new ApiError({
      errorCode: ErrorCodes.NETWORK_ERROR,
      statusCode: 502,
    });
    return c.json(
      {
        error: {
          id: apiError.id,
          code: apiError.code,
          key: apiError.key,
          details: apiError.details,
        },
      },
      502
    );
  }

  // Handle unknown errors
  const unknownError = new ApiError({
    errorCode: ErrorCodes.UNKNOWN_ERROR,
  });
  return c.json(
    {
      error: {
        id: unknownError.id,
        code: unknownError.code,
        key: unknownError.key,
      },
    },
    500
  );
};
