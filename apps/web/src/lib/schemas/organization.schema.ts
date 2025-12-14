import { z } from 'zod';
import { validationKeys } from '../zod-i18n';

/**
 * File validation constants
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

/**
 * Schema for creating an organization
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, validationKeys.orgNameRequired)
    .max(100, validationKeys.orgNameMax)
    .refine((val) => val.trim().length > 0, {
      message: validationKeys.orgNameEmpty,
    }),
  avatar: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: validationKeys.avatarSize,
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.has(file.type), {
      message: validationKeys.avatarFormat,
    })
    .optional(),
});

/**
 * Schema for updating an organization
 */
export const updateOrganizationSchema = createOrganizationSchema;

export type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationFormData = z.infer<typeof updateOrganizationSchema>;
