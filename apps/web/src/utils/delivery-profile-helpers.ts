import type { DeliveryType } from '@/components/orders/DeliveryTypeSelector';
import { SWISS_CANTONS, SWITZERLAND_COUNTRY } from '@/constants/location';
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
    state: SWISS_CANTONS[0]?.code ?? '',
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
        SWISS_CANTONS.find((canton) => canton.code === profile.address.state)?.code ??
        SWISS_CANTONS[0]?.code ??
        '',
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
