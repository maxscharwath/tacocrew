import { type CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Format a phone number for display
 * @param phoneNumber - Phone number in E.164 format (e.g., +41791234567)
 * @param defaultCountry - Default country code if phone number doesn't have country code
 * @returns Formatted phone number (e.g., +41 79 123 45 67) or original if invalid
 */
export function formatPhoneNumber(
  phoneNumber: string | null | undefined,
  defaultCountry: CountryCode = 'CH'
): string {
  if (!phoneNumber) {
    return '';
  }

  try {
    const phoneNumberObj = parsePhoneNumberFromString(phoneNumber, defaultCountry);
    if (!phoneNumberObj?.isValid()) {
      return phoneNumber;
    }
    return phoneNumberObj.formatInternational();
  } catch {
    return phoneNumber;
  }
}
