/**
 * Authentication types and interfaces
 * @module api/middleware/auth.types
 */

import type { Context } from 'hono';
import type { UserId } from '@/schemas/user.schema';

/**
 * Result of an authentication attempt
 */
export interface AuthResult {
  success: boolean;
  userId?: UserId;
  username?: string;
  slackId?: string;
  error?: Error;
}

/**
 * Authentication method handler
 * Each method should return an AuthResult indicating success or failure
 */
export type AuthMethod = (c: Context) => Promise<AuthResult>;
