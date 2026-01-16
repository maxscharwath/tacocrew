/**
 * Error handler for Hono
 * @module hono/middleware/error-handler
 */

import {
  CsrfError as ClientCsrfError,
  NetworkError as ClientNetworkError,
  RateLimitError as ClientRateLimitError,
} from '@tacocrew/gigatacos-client';
import { Context, ErrorHandler } from 'hono';
import { ErrorCodes } from '@/shared/types/types';
import { ApiError, CsrfError, NetworkError, RateLimitError } from '@/shared/utils/errors.utils';
import { logger } from '@/shared/utils/logger.utils';

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
  const clientErrorHandlers: Array<{
    check: (error: Error) => boolean;
    create: () => ApiError;
    statusCode: 400 | 401 | 403 | 404 | 409 | 429 | 500 | 502;
  }> = [
    {
      check: (error) => error instanceof ClientCsrfError,
      create: () => new CsrfError(),
      statusCode: 403,
    },
    {
      check: (error) => error instanceof ClientRateLimitError,
      create: () => new RateLimitError(),
      statusCode: 429,
    },
    {
      check: (error) => error instanceof ClientNetworkError,
      create: () => new NetworkError(),
      statusCode: 502,
    },
  ];

  for (const handler of clientErrorHandlers) {
    if (handler.check(err)) {
      const apiError = handler.create();
      return c.json(
        {
          error: {
            id: apiError.id,
            code: apiError.code,
            key: apiError.key,
            details: apiError.details,
          },
        },
        handler.statusCode
      );
    }
  }

  // Handle unknown errors
  const unknownError = new ApiError(ErrorCodes.UNKNOWN_ERROR, 500);
  return c.json(
    {
      error: {
        id: unknownError.id,
        code: unknownError.code,
        key: unknownError.key,
        details: unknownError.details,
      },
    },
    500
  );
};
