import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { z } from 'zod';
import { SwissCanton } from '@/constants/location';
import { validationKeys } from '../zod-i18n';

/**
 * Phone number validation using libphonenumber-js
 */
function isValidPhoneNumber(value: string): boolean {
  const phoneNumber = parsePhoneNumberFromString(value, 'CH');
  return phoneNumber?.isValid() ?? false;
}

/**
 * Swiss postcode validation (4 digits)
 */
const postcodeRegex = /^\d{4}$/;

/**
 * Delivery type enum
 */
export const deliveryTypeSchema = z.enum(['livraison', 'emporter']);

/**
 * Payment method enum
 */
export const paymentMethodSchema = z.enum(['especes', 'carte', 'twint']);

/**
 * Address schema (reusable)
 */
export const addressSchema = z.object({
  road: z.string().min(1, validationKeys.streetRequired).max(100, validationKeys.streetMax),
  houseNumber: z.string().max(10, validationKeys.houseNumberMax).optional(),
  postcode: z
    .string()
    .min(1, validationKeys.postcodeRequired)
    .regex(postcodeRegex, validationKeys.postcodeInvalid),
  city: z.string().min(1, validationKeys.cityRequired).max(100, validationKeys.cityMax),
  state: z.enum(SwissCanton),
  country: z.string(),
});

/**
 * Schema for submitting a group order
 */
export const submitGroupOrderSchema = z.object({
  customerName: z
    .string()
    .min(1, validationKeys.customerNameRequired)
    .max(100, validationKeys.nameMax),
  customerPhone: z
    .string()
    .min(1, validationKeys.phoneRequired)
    .refine(isValidPhoneNumber, validationKeys.phoneInvalid),
  deliveryType: deliveryTypeSchema,
  address: addressSchema,
  requestedFor: z.string().min(1, validationKeys.requestedTimeRequired),
  paymentMethod: paymentMethodSchema,
  dryRun: z.boolean().optional(),
});

/**
 * Schema for delivery profile
 */
export const deliveryProfileSchema = z.object({
  label: z
    .string()
    .min(1, validationKeys.profileLabelRequired)
    .max(50, validationKeys.profileLabelMax),
  contactName: z
    .string()
    .min(1, validationKeys.contactNameRequired)
    .max(100, validationKeys.contactNameMax),
  phone: z
    .string()
    .min(1, validationKeys.phoneRequired)
    .refine(isValidPhoneNumber, validationKeys.phoneInvalid),
  deliveryType: deliveryTypeSchema,
  address: addressSchema,
});

export type DeliveryType = z.infer<typeof deliveryTypeSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Address = z.infer<typeof addressSchema>;
export type SubmitGroupOrderFormData = z.infer<typeof submitGroupOrderSchema>;
export type DeliveryProfileFormData = z.infer<typeof deliveryProfileSchema>;
