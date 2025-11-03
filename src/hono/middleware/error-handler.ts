/**
 * Error handler for Hono
 * @module hono/middleware/error-handler
 */

import { Context, ErrorHandler } from 'hono';
import { ErrorCode } from '@/types';
import { ApiError } from '@/utils/errors';
import { logger } from '@/utils/logger';

/**
 * Global error handler for Hono
 */
export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  // Log the error
  logger.error('Request error', {
    method: c.req.method,
    url: c.req.url,
    error: err.message,
    stack: err.stack,
  });

  // Handle ApiError
  if (err instanceof ApiError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.statusCode as 200 | 400 | 401 | 403 | 404 | 409 | 429 | 500
    );
  }

  // Handle unknown errors
  return c.json(
    {
      error: {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'An unexpected error occurred',
      },
    },
    500
  );
};
