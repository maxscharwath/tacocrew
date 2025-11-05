/**
 * Create user use case
 * @module services/auth
 */

import { injectable } from 'tsyringe';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import type { User } from '@/schemas/user.schema';
import { AuthService } from '@/services/auth/auth.service';
import { ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

/**
 * Create user use case
 * Business logic for creating or retrieving a user
 */
@injectable()
export class CreateUserUseCase {
  private readonly userRepository = inject(UserRepository);
  private readonly authService = inject(AuthService);

  async execute(username: string): Promise<{ user: User; token: string }> {
    // Validate input
    if (!username || username.trim().length < 2) {
      throw new ValidationError('Username must be at least 2 characters long');
    }

    const trimmedUsername = username.trim();

    // Try to find existing user
    let user = await this.userRepository.findByUsername(trimmedUsername);

    // If user doesn't exist, create it
    if (!user) {
      user = await this.userRepository.create({
        username: trimmedUsername,
      });
      logger.info('User created', { userId: user.id, username: user.username });
    }

    // Generate token
    const token = this.authService.generateToken({
      id: user.id,
      username: user.username,
      slackId: user.slackId ?? undefined,
    });

    return { user, token };
  }
}
