/**
 * User repository
 * @module infrastructure/repositories/user
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { createUserFromDb, type User } from '@/schemas/user.schema';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

/**
 * User repository
 */
@injectable()
export class UserRepository {
  private readonly prisma = inject(PrismaService);

  async findById(id: string): Promise<User | null> {
    try {
      const dbUser = await this.prisma.client.user.findUnique({
        where: { id },
      });

      return dbUser ? createUserFromDb(dbUser) : null;
    } catch (error) {
      logger.error('Failed to find user by id', { id, error });
      return null;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const dbUser = await this.prisma.client.user.findUnique({
        where: { username },
      });

      return dbUser ? createUserFromDb(dbUser) : null;
    } catch (error) {
      logger.error('Failed to find user by username', { username, error });
      return null;
    }
  }

  async create(data: { username: string }): Promise<User> {
    try {
      const dbUser = await this.prisma.client.user.create({
        data: {
          username: data.username,
        },
      });

      logger.debug('User created', { id: dbUser.id });
      return createUserFromDb(dbUser);
    } catch (error) {
      logger.error('Failed to create user', { error });
      throw error;
    }
  }
}
