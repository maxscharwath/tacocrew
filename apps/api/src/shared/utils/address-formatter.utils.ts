/**
 * Address formatting utilities
 * @module utils/address-formatter
 */

import type { StructuredAddress } from '@/shared/types/types';

/**
 * Format structured address back to string format expected by backend API
 * Format: "road house_number, postcode city, state, country"
 *
 * @param address - Structured address object
 * @returns Formatted address string
 */
export function formatAddressForBackend(address: StructuredAddress): string {
  const street = address.house_number ? `${address.road} ${address.house_number}` : address.road;

  return [street, `${address.postcode} ${address.city}`, address.state, address.country]
    .filter(Boolean)
    .join(', ');
}
