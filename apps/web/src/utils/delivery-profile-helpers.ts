import type { DeliveryType } from '@/components/orders/DeliveryTypeSelector';
import { DEFAULT_CANTON_CODE, SWISS_CANTON_CODES, SWITZERLAND_COUNTRY } from '@/constants/location';
import type { DeliveryProfile, DeliveryProfilePayload } from '@/lib/api/types';

const initialFormState = (): DeliveryProfilePayload => ({
  label: '',
  contactName: '',
  phone: '',
  deliveryType: 'livraison' as DeliveryType,
  address: {
    road: '',
    houseNumber: '',
    postcode: '',
    city: '',
    state: DEFAULT_CANTON_CODE,
    country: SWITZERLAND_COUNTRY,
  },
});

/**
 * Convert a delivery profile to form payload
 */
export function profileToForm(profile: DeliveryProfile | null | undefined): DeliveryProfilePayload {
  if (!profile) {
    return initialFormState();
  }

  return {
    label: profile.label ?? '',
    contactName: profile.contactName,
    phone: profile.phone,
    deliveryType: profile.deliveryType,
    address: {
      road: profile.address.road,
      houseNumber: profile.address.houseNumber ?? '',
      postcode: profile.address.postcode,
      city: profile.address.city,
      state:
        SWISS_CANTON_CODES.find((code) => code === profile.address.state) ?? DEFAULT_CANTON_CODE,
      country: SWITZERLAND_COUNTRY,
    },
  };
}

/**
 * Get initial form state
 */
export function getInitialDeliveryFormState(): DeliveryProfilePayload {
  return initialFormState();
}
