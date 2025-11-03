/**
 * Authentication service with JWT bearer tokens
 * Simplified for future Slack integration
 * @module services/auth
 */

import jwt, { JsonWebTokenError, Secret, SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { injectable } from 'tsyringe';
import { config } from '@/config';
import type { UserId } from '@/domain/schemas/user.schema';
import { ValidationError } from '@/utils/errors';

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
      ...(user.slackId && { slackId: user.slackId }),
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
      if (error instanceof JsonWebTokenError) {
        throw new ValidationError('Invalid token');
      }
      if (error instanceof TokenExpiredError) {
        throw new ValidationError('Token expired');
      }
      throw new ValidationError('Token verification failed');
    }
  }
}
