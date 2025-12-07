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
    const dbUser = await this.prisma.client.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        language: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return dbUser ? createUserFromDb(dbUser) : null;
  }

  /**
   * Get user language preference (defaults to 'en')
   */
  async getUserLanguage(userId: string): Promise<string> {
    const dbUser = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { language: true },
    });

    return dbUser?.language ?? 'en';
  }

  /**
   * Update user language preference
   */
  async updateLanguage(userId: string, language: 'en' | 'fr' | 'de'): Promise<User | null> {
    try {
      const dbUser = await this.prisma.client.user.update({
        where: { id: userId },
        data: { language },
        select: {
          id: true,
          username: true,
          name: true,
          phone: true,
          language: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return createUserFromDb(dbUser);
    } catch (error) {
      // Prisma error P2025 = Record not found
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return null;
      }
      logger.error('Failed to update user language', { userId, error });
      return null;
    }
  }

  async updatePhone(userId: string, phone: string | null): Promise<User | null> {
    try {
      const dbUser = await this.prisma.client.user.update({
        where: { id: userId },
        data: { phone },
        select: {
          id: true,
          username: true,
          name: true,
          phone: true,
          language: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return createUserFromDb(dbUser);
    } catch (error) {
      // Prisma error P2025 = Record not found
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return null;
      }
      logger.error('Failed to update user phone', { userId, error });
      return null;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    const dbUser = await this.prisma.client.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        language: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return dbUser ? createUserFromDb(dbUser) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const dbUser = await this.prisma.client.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        language: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
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

  /**
   * Update user profile image
   */
  async updateImage(userId: string, image: Buffer | null): Promise<User | null> {
    try {
      const storedImage = image ? image.toString('base64') : null;
      const dbUser = await this.prisma.client.user.update({
        where: { id: userId },
        data: { image: storedImage },
        select: {
          id: true,
          username: true,
          name: true,
          phone: true,
          language: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return createUserFromDb(dbUser);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return null;
      }
      logger.error('Failed to update user image', { userId, error });
      return null;
    }
  }

  async findAvatarById(userId: string): Promise<{ image: Buffer; updatedAt: Date | null } | null> {
    const dbUser = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        image: true,
        updatedAt: true,
      },
    });

    if (!dbUser?.image) {
      return null;
    }

    return {
      image: Buffer.from(dbUser.image, 'base64'),
      updatedAt: dbUser.updatedAt,
    };
  }
}
