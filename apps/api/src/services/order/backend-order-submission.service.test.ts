/**
 * Unit tests for address formatter utility
 */

import { describe, expect, test as it } from 'bun:test';
import type { StructuredAddress } from '@/shared/types/types';
import { formatAddressForBackend } from '@/shared/utils/address-formatter.utils';

describe('formatAddressForBackend', () => {
  it('should format address with all fields', () => {
    const address: StructuredAddress = {
      road: 'Rue de la Gare',
      house_number: '15',
      postcode: '1000',
      city: 'Lausanne',
      state: 'Vaud',
      country: 'Switzerland',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Rue de la Gare 15, 1000 Lausanne, Vaud, Switzerland');
  });

  it('should format address without house number', () => {
    const address: StructuredAddress = {
      road: 'Chemin du dessus',
      postcode: '1000',
      city: 'Lausanne',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Chemin du dessus, 1000 Lausanne');
  });

  it('should format address without optional fields (state, country)', () => {
    const address: StructuredAddress = {
      road: 'Rue Example',
      house_number: '42',
      postcode: '1000',
      city: 'Lausanne',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Rue Example 42, 1000 Lausanne');
  });

  it('should format address with only required fields', () => {
    const address: StructuredAddress = {
      road: 'Avenue Test',
      postcode: '2000',
      city: 'Neuchâtel',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Avenue Test, 2000 Neuchâtel');
  });

  it('should format address with state but no country', () => {
    const address: StructuredAddress = {
      road: 'Rue Test',
      house_number: '10',
      postcode: '1200',
      city: 'Genève',
      state: 'Genève',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Rue Test 10, 1200 Genève, Genève');
  });

  it('should format address with country but no state', () => {
    const address: StructuredAddress = {
      road: 'Boulevard Example',
      postcode: '3000',
      city: 'Bern',
      country: 'Switzerland',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Boulevard Example, 3000 Bern, Switzerland');
  });
});
