/**
 * Username header authentication method
 * @module api/middleware/auth-methods/username-header
 */

import type { Context } from 'hono';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { UnauthorizedError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import type { AuthResult } from '../auth.types';

/**
 * Username header authentication method
 * Validates and creates users based on the x-username header
 */
export async function usernameHeaderAuth(c: Context): Promise<AuthResult> {
  const usernameHeader = c.req.header('x-username');

  if (!usernameHeader || usernameHeader.trim() === '') {
    return { success: false };
  }

  const trimmedUsername = usernameHeader.trim();

  if (trimmedUsername.length < 2) {
    return {
      success: false,
      error: new UnauthorizedError('x-username header must be at least 2 characters long'),
    };
  }

  try {
    const userRepository = inject(UserRepository);
    let user = await userRepository.findByUsername(trimmedUsername);

    if (!user) {
      user = await userRepository.create({ username: trimmedUsername });
    }

    return {
      success: true,
      userId: user.id,
      username: user.username,
      slackId: user.slackId ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to authenticate user'),
    };
  }
}
