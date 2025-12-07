/**
 * Tests for AuthService
 */

// Load test environment variables first
import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import jwt from 'jsonwebtoken';
import { container } from 'tsyringe';
import { AuthService } from '@/services/auth/auth.service';
import { ValidationError } from '@/shared/utils/errors.utils';
import { config } from '@/shared/config/app.config';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('AuthService', () => {
  const jwtSecret = config.auth.jwtSecret;
  const jwtExpiresIn = config.auth.jwtExpiresIn;

  beforeEach(() => {
    container.clearInstances();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = randomUUID();
      const username = 'testuser';
      const service = new AuthService();

      const token = service.generateToken({ id: userId, username });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token can be decoded
      const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      expect(decoded.userId).toBe(userId);
      expect(decoded.username).toBe(username);
    });

    it('should include expiration in token', () => {
      const userId = randomUUID();
      const username = 'testuser';
      const service = new AuthService();

      const token = service.generateToken({ id: userId, username });
      const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const userId = randomUUID();
      const username = 'testuser';
      const service = new AuthService();

      const token = service.generateToken({ id: userId, username });
      const payload = service.verifyToken(token);

      expect(payload.userId).toBe(userId);
      expect(payload.username).toBe(username);
    });

    it('should throw ValidationError for invalid token', () => {
      const service = new AuthService();

      expect(() => {
        service.verifyToken('invalid-token');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for expired token', () => {
      const userId = randomUUID();
      const username = 'testuser';
      const service = new AuthService();

      // Create an expired token
      const expiredToken = jwt.sign(
        { userId, username },
        jwtSecret,
        { expiresIn: '-1h' }
      );

      expect(() => {
        service.verifyToken(expiredToken);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for token with wrong secret', () => {
      const userId = randomUUID();
      const username = 'testuser';

      // Create token with different secret
      const token = jwt.sign({ userId, username }, 'wrong-secret', { expiresIn: '1h' });
      const service = new AuthService();

      expect(() => {
        service.verifyToken(token);
      }).toThrow(ValidationError);
    });
  });
});
