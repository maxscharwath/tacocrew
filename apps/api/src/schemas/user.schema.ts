/**
 * User domain schema (Zod)
 * @module schemas/user
 */

import { z } from 'zod';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';

/**
 * User ID type - branded string
 */
export type UserId = Id<'User'>;

/**
 * Parse a string to UserId
 */
export const UserId = zId<UserId>();

/**
 * User schema using Zod
 */
export const UserSchema = z.object({
  id: UserId,
  username: z.string().nullable(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  language: z.string().nullable(),
  hasImage: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * User from database
 */
const DbImageSchema = z
  .union([z.instanceof(Buffer), z.instanceof(Uint8Array), z.string()])
  .nullable()
  .optional();

export const UserFromDbSchema = z.object({
  id: z.string(), // UUID from DB as string
  username: z.string().nullable(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  language: z.string().nullable(),
  image: DbImageSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Create User from database model
 */
export function createUserFromDb(data: z.infer<typeof UserFromDbSchema>): User {
  const parsed = UserFromDbSchema.parse(data);
  const { image, ...rest } = parsed;
  return UserSchema.parse({
    ...rest,
    hasImage: Boolean(image),
  });
}
