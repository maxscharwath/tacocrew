/**
 * Authentication middleware for bearer token validation
 * @module hono/middleware/auth
 */

import { Context, Next } from 'hono';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { AuthService } from '@/services/auth.service';
import { UnauthorizedError } from '@/utils/errors';
import { inject } from '@/utils/inject';

/**
 * Middleware to validate bearer token and extract user info
 * Stores user info in context for use in route handlers
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('authorization');
  const usernameHeader = c.req.header('x-username');

  if (authHeader && authHeader.startsWith('Bearer ')) {
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
      return;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  if (usernameHeader && usernameHeader.trim() !== '') {
    const trimmedUsername = usernameHeader.trim();

    if (trimmedUsername.length < 2) {
      throw new UnauthorizedError('x-username header must be at least 2 characters long');
    }

    const userRepository = inject(UserRepository);
    let user = await userRepository.findByUsername(trimmedUsername);

    if (!user) {
      user = await userRepository.create({ username: trimmedUsername });
    }

    c.set('userId', user.id);
    c.set('username', user.username);
    if (user.slackId) {
      c.set('slackId', user.slackId);
    }

    await next();
    return;
  }

  throw new UnauthorizedError(
    'Authorization header with Bearer token or x-username header is required'
  );
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('authorization');
  const usernameHeader = c.req.header('x-username');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const authService = inject(AuthService);
      const payload = authService.verifyToken(token);
      c.set('userId', payload.userId);
      c.set('username', payload.username);
      if (payload.slackId) {
        c.set('slackId', payload.slackId);
      }
    } catch {
      // Ignore errors for optional auth
    }
  }

  if (!c.var.userId && usernameHeader && usernameHeader.trim() !== '') {
    const trimmedUsername = usernameHeader.trim();

    if (trimmedUsername.length >= 2) {
      try {
        const userRepository = inject(UserRepository);
        let user = await userRepository.findByUsername(trimmedUsername);
        if (!user) {
          user = await userRepository.create({ username: trimmedUsername });
        }

        c.set('userId', user.id);
        c.set('username', user.username);
        if (user.slackId) {
          c.set('slackId', user.slackId);
        }
      } catch {
        // Ignore username header errors for optional auth
      }
    }
  }

  await next();
}
