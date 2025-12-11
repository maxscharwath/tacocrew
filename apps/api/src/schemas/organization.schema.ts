/**
 * Organization domain schema (Zod)
 * @module schemas/organization
 */

import { z } from 'zod';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';

/**
 * Organization ID type - branded string
 */
export type OrganizationId = Id<'Organization'>;

/**
 * Parse a string to OrganizationId
 */
export const OrganizationId = zId<OrganizationId>();

/**
 * Organization schema using Zod
 */
export const OrganizationSchema = z.object({
  id: OrganizationId,
  name: z.string(),
  image: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

/**
 * Organization from database
 */
export const OrganizationFromDbSchema = z.object({
  id: z.string(), // UUID from DB as string
  name: z.string(),
  image: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Create Organization from database record
 */
export function createOrganizationFromDb(
  db: z.infer<typeof OrganizationFromDbSchema>
): Organization {
  return {
    id: OrganizationId.parse(db.id),
    name: db.name,
    image: db.image ?? null,
    createdAt: db.createdAt,
    updatedAt: db.updatedAt,
  };
}
