import { z } from 'zod';
import { validationKeys } from '../zod-i18n';

/**
 * Schema for login form
 */
export const loginSchema = z.object({
  email: z.email(validationKeys.email).min(1, validationKeys.required),
  password: z.string().min(8, validationKeys.passwordMin).max(100, validationKeys.passwordMax),
});

/**
 * Schema for signup form
 */
export const signupSchema = loginSchema.extend({
  name: z.string().min(2, validationKeys.nameMin).max(100, validationKeys.nameMax).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
