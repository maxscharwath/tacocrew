/**
 * Bearer token authentication method
 * @module api/middleware/auth-methods/bearer-token
 */

import type { Context } from 'hono';
import type { AuthResult } from '@/api/middleware/auth.types';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { AuthService } from '@/services/auth/auth.service';
import { UnauthorizedError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';

/**
 * Bearer token authentication method
 * Validates JWT tokens from the Authorization header and fetches the full user
 */
export async function bearerTokenAuth(c: Context): Promise<AuthResult> {
  const authHeader = c.req.header('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const authService = inject(AuthService);
    const payload = authService.verifyToken(token);

    // Fetch the full user object
    const userRepository = inject(UserRepository);
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      return { success: false, error: new UnauthorizedError() };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new UnauthorizedError(),
    };
  }
}
