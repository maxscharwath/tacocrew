import type { CountryCode } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';

export function useCountryName() {
  const { i18n } = useTranslation();

  const getCountryName = (countryCode: CountryCode) => {
    try {
      return new Intl.DisplayNames([i18n.language], { type: 'region' }).of(countryCode) || countryCode;
    } catch {
      return countryCode;
    }
  };

  return { getCountryName };
}

