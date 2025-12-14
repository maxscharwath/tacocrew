import type { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * Creates a Zod error map that uses i18n for error messages
 * This allows all Zod validation errors to be automatically translated
 */
export function createZodErrorMap(t: TFunction): z.ZodErrorMap {
  // biome-ignore lint/suspicious/noExplicitAny: Zod v4 error map signature requires any
  return ((issue: any, _ctx: any) => {
    let message: string;

    // Helper to check if a message is a translation key and translate it
    const translateMessage = (msg: string | undefined): string => {
      if (!msg) return t('validation.invalid');
      // If the message looks like a translation key (starts with 'validation.'), translate it
      if (msg.startsWith('validation.')) {
        const translated = t(msg);
        // Debug: Log translation (remove in production)
        if (import.meta.env.DEV) {
          console.log('[Zod i18n]', { key: msg, translated });
        }
        return translated;
      }
      // Otherwise return as-is (already translated or custom message)
      return msg;
    };

    switch (issue.code) {
      case 'invalid_type':
        // Check for custom message first
        if (issue.message) {
          message = translateMessage(issue.message);
        } else if (issue.received === 'undefined') {
          message = t('validation.required');
        } else {
          message = t('validation.invalidType', {
            expected: issue.expected,
            received: issue.received,
          });
        }
        break;

      case 'too_small':
        // Check for custom message first
        if (issue.message) {
          message = translateMessage(issue.message);
        } else if (issue.type === 'string') {
          message =
            issue.minimum === 1
              ? t('validation.required')
              : t('validation.minLength', { min: issue.minimum });
        } else if (issue.type === 'number') {
          message = issue.inclusive
            ? t('validation.minNumber', { min: issue.minimum })
            : t('validation.minNumberExclusive', { min: issue.minimum });
        } else if (issue.type === 'array') {
          message = t('validation.minItems', { min: issue.minimum });
        } else {
          message = t('validation.tooSmall');
        }
        break;

      case 'too_big':
        // Check for custom message first
        if (issue.message) {
          message = translateMessage(issue.message);
        } else if (issue.type === 'string') {
          message = t('validation.maxLength', { max: issue.maximum });
        } else if (issue.type === 'number') {
          message = issue.inclusive
            ? t('validation.maxNumber', { max: issue.maximum })
            : t('validation.maxNumberExclusive', { max: issue.maximum });
        } else if (issue.type === 'array') {
          message = t('validation.maxItems', { max: issue.maximum });
        } else {
          message = t('validation.tooBig');
        }
        break;

      case 'invalid_string':
        // Check for custom message first
        if (issue.message) {
          message = translateMessage(issue.message);
        } else if (issue.validation === 'email') {
          message = t('validation.email');
        } else if (issue.validation === 'url') {
          message = t('validation.url');
        } else if (issue.validation === 'uuid') {
          message = t('validation.uuid');
        } else if (issue.validation && 'includes' in issue.validation) {
          message = t('validation.includes', { value: issue.validation.includes });
        } else if (issue.validation && 'startsWith' in issue.validation) {
          message = t('validation.startsWith', { value: issue.validation.startsWith });
        } else if (issue.validation && 'endsWith' in issue.validation) {
          message = t('validation.endsWith', { value: issue.validation.endsWith });
        } else {
          message = t('validation.invalidString');
        }
        break;

      case 'custom':
        // Custom messages from schema - translate if it's a key
        message = translateMessage(issue.message);
        break;

      default:
        message = issue.message ? translateMessage(issue.message) : t('validation.invalid');
    }

    return { message };
  }) as z.ZodErrorMap;
}

/**
 * Validation message keys for specific field validations
 * Use these in your schemas for consistent, translatable error messages
 */
export const validationKeys = {
  // Common
  required: 'validation.required',
  invalid: 'validation.invalid',

  // Auth
  email: 'validation.email',
  emailInvalid: 'validation.email',
  // NOSONAR - These are i18n keys, not actual passwords
  password: 'validation.password', // NOSONAR
  passwordMin: 'validation.passwordMin', // NOSONAR
  passwordMax: 'validation.passwordMax', // NOSONAR
  nameMin: 'validation.nameMin',
  nameMax: 'validation.nameMax',

  // Organization
  orgNameRequired: 'validation.orgNameRequired',
  orgNameEmpty: 'validation.orgNameEmpty',
  orgNameMax: 'validation.orgNameMax',
  avatarSize: 'validation.avatarSize',
  avatarFormat: 'validation.avatarFormat',

  // Delivery
  streetRequired: 'validation.streetRequired',
  streetMax: 'validation.streetMax',
  houseNumberMax: 'validation.houseNumberMax',
  postcodeRequired: 'validation.postcodeRequired',
  postcodeInvalid: 'validation.postcodeInvalid',
  cityRequired: 'validation.cityRequired',
  cityMax: 'validation.cityMax',
  phoneRequired: 'validation.phoneRequired',
  phoneInvalid: 'validation.phoneInvalid',
  profileLabelRequired: 'validation.profileLabelRequired',
  profileLabelMax: 'validation.profileLabelMax',
  contactNameRequired: 'validation.contactNameRequired',
  contactNameMax: 'validation.contactNameMax',

  // Order
  orderNameRequired: 'validation.orderNameRequired',
  orderNameMax: 'validation.orderNameMax',
  startDateRequired: 'validation.startDateRequired',
  endDateRequired: 'validation.endDateRequired',
  endDateAfterStart: 'validation.endDateAfterStart',
  quantityMin: 'validation.quantityMin',
  meatRequired: 'validation.meatRequired',
  sauceRequired: 'validation.sauceRequired',
  tacoOrItems: 'validation.tacoOrItems',
  noteMax: 'validation.noteMax',
  customerNameRequired: 'validation.customerNameRequired',
  requestedTimeRequired: 'validation.requestedTimeRequired',
} as const;
