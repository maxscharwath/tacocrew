/**
 * Authentication middleware for bearer token validation
 * @module hono/middleware/auth
 */

import { Context, Next } from 'hono';
import { AuthService } from '../../services/auth.service';
import { ValidationError } from '../../utils/errors';
import { inject } from '../../utils/inject';

/**
 * Middleware to validate bearer token and extract user info
 * Stores user info in context for use in route handlers
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ValidationError('Authorization header with Bearer token is required', 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const authService = inject(AuthService);
    const payload = authService.verifyToken(token);

    // Store user info in context
    c.set('userId', payload.userId);
    c.set('username', payload.username);
    if (payload.slackId) {
      c.set('slackId', payload.slackId);
    }

    await next();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid or expired token', 401);
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const authService = inject(AuthService);
      const payload = authService.verifyToken(token);
      c.set('userId', payload.userId);
      c.set('username', payload.username);
      c.set('email', payload.email);
    } catch {
      // Ignore errors for optional auth
    }
  }

  await next();
}
