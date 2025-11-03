/**
 * User domain schema (Zod)
 * @module domain/schemas/user
 */

import { z } from 'zod';
import type { Id } from '@/domain/entities/branded-types';
import { zId } from '@/domain/entities/branded-types';

/**
 * User ID type - branded string
 */
export type UserId = Id<'User'>;

/**
 * Parse a string to UserId
 */
export const UserIdSchema = zId<UserId>();

/**
 * User schema using Zod
 */
export const UserSchema = z.object({
  id: zId<UserId>(),
  username: z.string(),
  slackId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * User from database (with nullable slackId)
 */
export const UserFromDbSchema = z.object({
  id: z.string(), // UUID from DB as string
  username: z.string(),
  slackId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Create User from database model
 */
export function createUserFromDb(data: z.infer<typeof UserFromDbSchema>): User {
  return UserSchema.parse({
    ...data,
    slackId: data.slackId ?? undefined,
  });
}

/**
 * Check if user has Slack integration
 */
export function hasSlackIntegration(user: User): boolean {
  return !!user.slackId;
}
