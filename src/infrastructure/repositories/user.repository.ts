/**
 * User repository (infrastructure layer)
 * @module infrastructure/repositories/user
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/database/prisma.service';
import { createUserFromDb, type User, type UserId } from '@/domain/schemas/user.schema';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

/**
 * User repository
 */
@injectable()
export class UserRepository {
  private readonly prisma = inject(PrismaService);

  async create(data: { username: string; slackId?: string }): Promise<User> {
    try {
      const dbUser = await this.prisma.client.user.create({
        data: {
          username: data.username,
          slackId: data.slackId,
        },
      });

      return createUserFromDb(dbUser);
    } catch (error) {
      logger.error('Failed to create user', { username: data.username, error });
      throw error;
    }
  }

  async findById(id: UserId): Promise<User | null> {
    try {
      const dbUser = await this.prisma.client.user.findUnique({
        where: { id },
      });

      return dbUser ? createUserFromDb(dbUser) : null;
    } catch (error) {
      logger.error('Failed to find user by ID', { id, error });
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

  async findBySlackId(slackId: string): Promise<User | null> {
    try {
      const dbUser = await this.prisma.client.user.findFirst({
        where: { slackId },
      });

      return dbUser ? createUserFromDb(dbUser) : null;
    } catch (error) {
      logger.error('Failed to find user by Slack ID', { slackId, error });
      return null;
    }
  }

  async updateSlackId(userId: UserId, slackId: string): Promise<User> {
    try {
      const dbUser = await this.prisma.client.user.update({
        where: { id: userId },
        data: { slackId },
      });

      return createUserFromDb(dbUser);
    } catch (error) {
      logger.error('Failed to update Slack ID', { userId, slackId, error });
      throw error;
    }
  }

  async exists(id: UserId): Promise<boolean> {
    try {
      const count = await this.prisma.client.user.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check user existence', { id, error });
      return false;
    }
  }
}
