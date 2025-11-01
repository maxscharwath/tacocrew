/**
 * Authentication service with JWT bearer tokens
 * Simplified for future Slack integration
 * @module services/auth
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import * as jwt from 'jsonwebtoken';
import { UserRepository } from '../database/user.repository';
import { ValidationError } from '../utils/errors';
import { inject } from '../utils/inject';
import { logger } from '../utils/logger';

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  username: string;
  slackId?: string;
}

/**
 * Authentication service
 * Simplified - password/auth will be handled by Slack OAuth later
 */
@injectable()
export class AuthService {
  private readonly userRepository = inject(UserRepository);
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: { id: string; username: string; slackId?: string }): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      ...(user.slackId && { slackId: user.slackId }),
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ValidationError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new ValidationError('Token expired');
      }
      throw new ValidationError('Token verification failed');
    }
  }

  /**
   * Create or get user by username (temporary until Slack OAuth is implemented)
   * This will be replaced with Slack OAuth flow later
   */
  async createOrGetUser(username: string): Promise<{ user: { id: string; username: string; slackId?: string }; token: string }> {
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
    const token = this.generateToken({
      id: user.id,
      username: user.username,
      slackId: user.slackId,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        ...(user.slackId && { slackId: user.slackId }),
      },
      token,
    };
  }
}
