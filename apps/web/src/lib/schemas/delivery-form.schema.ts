import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { z } from 'zod';
import { SWISS_CANTON_CODES } from '@/constants/location';
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

const swissCantonCodes = SWISS_CANTON_CODES as [string, ...string[]];

/**
 * Delivery form schema - flat fields for form submission
 * Note: This schema is for client-side validation only.
 * The form fields are managed by react-hook-form with Controller components.
 */
export const DeliveryFormSchema = z.object({
  customerName: z
    .string()
    .min(1, validationKeys.customerNameRequired)
    .max(100, validationKeys.nameMax),
  customerPhone: z
    .string()
    .min(1, validationKeys.phoneRequired)
    .refine(isValidPhoneNumber, validationKeys.phoneInvalid),
  deliveryType: z.enum(['livraison', 'emporter'] as const, {
    message: validationKeys.deliveryTypeRequired,
  }),
  road: z.string().min(1, validationKeys.streetRequired).max(100, validationKeys.streetMax),
  houseNumber: z.string().max(10, validationKeys.houseNumberMax).optional(),
  postcode: z
    .string()
    .min(1, validationKeys.postcodeRequired)
    .regex(postcodeRegex, validationKeys.postcodeInvalid),
  city: z.string().min(1, validationKeys.cityRequired).max(100, validationKeys.cityMax),
  stateRegion: z.enum(swissCantonCodes, {
    message: validationKeys.stateRegionRequired,
  }),
  requestedFor: z.string(), // Empty string means ASAP, otherwise HH:MM format
  paymentMethod: z.enum(['especes', 'carte', 'twint'] as const, {
    message: validationKeys.paymentMethodRequired,
  }),
});

export type DeliveryFormData = z.infer<typeof DeliveryFormSchema>;
