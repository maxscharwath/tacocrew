/**
 * User repository
 * @module database/user
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/database/prisma.service';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

/**
 * User data
 */
export interface UserData {
  id: string;
  username: string;
  slackId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository for managing users
 */
@injectable()
export class UserRepository {
  private readonly prisma = inject(PrismaService);

  /**
   * Create a new user
   */
  async create(data: { username: string; slackId?: string }): Promise<UserData> {
    try {
      const user = await this.prisma.client.user.create({
        data: {
          username: data.username,
          slackId: data.slackId,
        },
      });

      return this.mapToUserData(user);
    } catch (error) {
      logger.error('Failed to create user', { username: data.username, error });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserData | null> {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { id },
      });

      return user ? this.mapToUserData(user) : null;
    } catch (error) {
      logger.error('Failed to find user by ID', { id, error });
      return null;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<UserData | null> {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { username },
      });

      return user ? this.mapToUserData(user) : null;
    } catch (error) {
      logger.error('Failed to find user by username', { username, error });
      return null;
    }
  }

  /**
   * Find user by Slack ID
   */
  async findBySlackId(slackId: string): Promise<UserData | null> {
    try {
      const user = await this.prisma.client.user.findFirst({
        where: { slackId },
      });

      return user ? this.mapToUserData(user) : null;
    } catch (error) {
      logger.error('Failed to find user by Slack ID', { slackId, error });
      return null;
    }
  }

  /**
   * Update user's Slack ID
   */
  async updateSlackId(userId: string, slackId: string): Promise<UserData> {
    try {
      const user = await this.prisma.client.user.update({
        where: { id: userId },
        data: { slackId },
      });

      return this.mapToUserData(user);
    } catch (error) {
      logger.error('Failed to update Slack ID', { userId, slackId, error });
      throw error;
    }
  }

  /**
   * Check if user exists
   */
  async exists(id: string): Promise<boolean> {
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

  /**
   * Map database model to UserData
   */
  private mapToUserData(user: {
    id: string;
    username: string;
    slackId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserData {
    return {
      id: user.id,
      username: user.username,
      slackId: user.slackId || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
