/**
 * User domain schema (Zod)
 * @module schemas/user
 */

import { z } from 'zod';
import type { Id } from '../shared/utils/branded-ids.utils';
import { zId } from '../shared/utils/branded-ids.utils';

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
  username: z.string().nullable(),
  name: z.string().nullable(),
  slackId: z.string().nullish(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * User from database (with nullable slackId and username)
 */
export const UserFromDbSchema = z.object({
  id: z.string(), // UUID from DB as string
  username: z.string().nullable(),
  name: z.string().nullable(),
  slackId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Create User from database model
 */
export function createUserFromDb(data: z.infer<typeof UserFromDbSchema>): User {
  return UserSchema.parse(data);
}

/**
 * Check if user has Slack integration
 */
export function hasSlackIntegration(user: User): boolean {
  return !!user.slackId;
}
