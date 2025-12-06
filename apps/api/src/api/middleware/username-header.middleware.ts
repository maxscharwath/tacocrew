/**
 * Username header validation middleware
 * @module hono/middleware/username-header
 */

import { Context, Next } from 'hono';
import { ValidationError } from '@/shared/utils/errors.utils';

/**
 * Middleware to validate and extract username from header
 * Stores username in context for use in route handlers
 */
export async function usernameHeader(c: Context, next: Next) {
  const username = c.req.header('x-username');

  if (!username || username.trim() === '') {
    throw new ValidationError({ message: 'x-username header is required' });
  }

  // Store username in context for route handlers
  c.set('username', username.trim());

  await next();
}
