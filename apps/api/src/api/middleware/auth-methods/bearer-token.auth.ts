/**
 * Bearer token authentication method
 * @module api/middleware/auth-methods/bearer-token
 */

import type { Context } from 'hono';
import type { AuthResult } from '@/api/middleware/auth.types';
import { AuthService } from '@/services/auth/auth.service';
import { UnauthorizedError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';

/**
 * Bearer token authentication method
 * Validates JWT tokens from the Authorization header
 */
export function bearerTokenAuth(c: Context): Promise<AuthResult> {
  const authHeader = c.req.header('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return Promise.resolve({ success: false });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const authService = inject(AuthService);
    const payload = authService.verifyToken(token);

    return Promise.resolve({
      success: true,
      userId: payload.userId,
      username: payload.username,
      slackId: payload.slackId,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Promise.resolve({ success: false, error });
    }
    return Promise.resolve({
      success: false,
      error: new UnauthorizedError(),
    });
  }
}
