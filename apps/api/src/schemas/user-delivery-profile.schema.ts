/**
 * User delivery profile schema
 */
import { z } from 'zod';
import type { UserId } from '@/schemas/user.schema';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';

export type UserDeliveryProfileId = Id<'UserDeliveryProfile'>;

export const UserDeliveryProfileIdSchema = zId<UserDeliveryProfileId>();

export const DeliveryAddressSchema = z.object({
  road: z.string().min(1),
  houseNumber: z.string().optional(),
  postcode: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().optional(),
});

export const UserDeliveryProfileSchema = z.object({
  id: UserDeliveryProfileIdSchema,
  userId: zId<UserId>(),
  label: z.string().min(1).max(120).nullable(),
  contactName: z.string().min(1),
  phone: z.string().min(1),
  deliveryType: z.enum(['livraison', 'emporter']),
  address: DeliveryAddressSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserDeliveryProfile = z.infer<typeof UserDeliveryProfileSchema>;

export const UserDeliveryProfileFromDbSchema = z.object({
  id: z.string(),
  userId: z.string(),
  label: z.string().nullish(),
  contactName: z.string(),
  phone: z.string(),
  deliveryType: z.string(),
  road: z.string(),
  houseNumber: z.string().nullish(),
  postcode: z.string(),
  city: z.string(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Build a domain entity from database data with minimal transformation.
 * Note: userId may be a Better Auth ID (not a UUID), so we bypass UUID validation
 * for userId while still validating other fields.
 */
export function createUserDeliveryProfileFromDb(
  data: z.infer<typeof UserDeliveryProfileFromDbSchema>
): UserDeliveryProfile {
  // Validate all fields except userId (which may be a Better Auth ID, not UUID)
  const validated = UserDeliveryProfileFromDbSchema.parse(data);

  // Create the delivery profile with userId as-is (may be Better Auth ID or UUID)
  // We cast it to UserId to satisfy the type system, but we don't validate it as UUID
  return {
    id: UserDeliveryProfileIdSchema.parse(validated.id),
    userId: validated.userId as UserId, // Accept Better Auth IDs or UUIDs
    label: validated.label ?? null,
    contactName: validated.contactName,
    phone: validated.phone,
    deliveryType: validated.deliveryType as 'livraison' | 'emporter',
    address: {
      road: validated.road,
      houseNumber: validated.houseNumber ?? undefined,
      postcode: validated.postcode,
      city: validated.city,
      state: validated.state ?? undefined,
      country: validated.country ?? undefined,
    },
    createdAt: validated.createdAt,
    updatedAt: validated.updatedAt,
  };
}
