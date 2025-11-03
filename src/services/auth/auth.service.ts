/**
 * Authentication service with JWT bearer tokens
 * Simplified for future Slack integration
 * @module services/auth
 */

import type { Secret, SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { injectable } from 'tsyringe';
import type { UserId } from '@/schemas/user.schema';
import { config } from '@/shared/config/app.config';
import { ValidationError } from '@/shared/utils/errors.utils';

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: UserId;
  username: string;
  slackId?: string;
}

/**
 * Authentication service
 * Handles JWT token generation and verification
 * User creation/management is handled by use cases
 */
@injectable()
export class AuthService {
  private readonly jwtSecret: Secret;
  private readonly jwtExpiresIn: SignOptions['expiresIn'];

  constructor() {
    const { jwtSecret, jwtExpiresIn } = config.auth;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn as SignOptions['expiresIn'];
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: { id: UserId; username: string; slackId?: string }): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      slackId: user.slackId,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      // Access error classes from jwt default export for ESM compatibility
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ValidationError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new ValidationError('Token expired');
      }
      throw new ValidationError('Token verification failed');
    }
  }
}
