/**
 * User repository
 * @module infrastructure/repositories/user
 */

import { injectable } from 'tsyringe';
import { createUserFromDb, type User } from '../../schemas/user.schema';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';
import { PrismaService } from '../database/prisma.service';

/**
 * User repository
 */
@injectable()
export class UserRepository {
  private readonly prisma = inject(PrismaService);

  async findById(id: string): Promise<User | null> {
    const dbUser = await this.prisma.client.user.findUnique({
      where: { id },
    });

    return dbUser ? createUserFromDb(dbUser) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const dbUser = await this.prisma.client.user.findUnique({
      where: { username },
    });

    return dbUser ? createUserFromDb(dbUser) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const dbUser = await this.prisma.client.user.findUnique({
      where: { email },
    });

    return dbUser ? createUserFromDb(dbUser) : null;
  }

  async create(data: { username: string; email: string; name?: string }): Promise<User> {
    try {
      const dbUser = await this.prisma.client.user.create({
        data: {
          username: data.username,
          email: data.email,
          name: data.name || data.username,
        },
      });

      logger.debug('User created', { id: dbUser.id });
      return createUserFromDb(dbUser);
    } catch (error) {
      logger.error('Failed to create user', { error });
      throw error;
    }
  }

  /**
   * Update an existing user's username and name
   * Used to fix Better Auth users that have null username
   */
  async updateUsernameByEmail(
    email: string,
    username: string,
    name?: string
  ): Promise<User | null> {
    try {
      const dbUser = await this.prisma.client.user.update({
        where: { email },
        data: {
          username,
          ...(name && { name }),
        },
      });

      // Try to create User object - if it fails (e.g., ID is not UUID), return null
      try {
        return createUserFromDb(dbUser);
      } catch (validationError) {
        logger.warn('Updated user but validation failed', {
          email,
          userId: dbUser.id,
          error: validationError,
        });
        return null;
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        // Record not found
        return null;
      }
      logger.error('Failed to update user username', { email, error });
      return null;
    }
  }
}
