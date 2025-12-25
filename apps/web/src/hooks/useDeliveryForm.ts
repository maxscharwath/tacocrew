import { useEffect, useRef, useState } from 'react';
import type { DeliveryType } from '@/components/orders/DeliveryTypeSelector';
import {
  DEFAULT_CANTON_CODE,
  SWISS_CANTON_CODES,
  SWITZERLAND_COUNTRY,
  type SwissCanton,
} from '@/constants/location';
import { ApiError } from '@/lib/api/http';
import type { DeliveryProfile, DeliveryProfilePayload, PaymentMethod } from '@/lib/api/types';
import {
  createDeliveryProfile,
  deleteDeliveryProfile,
  updateDeliveryProfile,
} from '@/lib/api/user';

type ProfileMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

type UseDeliveryFormProps = {
  readonly initialProfiles: DeliveryProfile[];
  readonly t: (key: string) => string;
};

export function useDeliveryForm({ initialProfiles, t }: UseDeliveryFormProps) {
  // Payment and delivery preferences
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('especes');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('livraison');
  const [requestedFor, setRequestedFor] = useState<string>('');

  // Delivery profiles state
  const [deliveryProfiles, setDeliveryProfiles] = useState(initialProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfiles[0]?.id ?? '');
  const manualProfileClearRef = useRef(false);

  // Customer contact information
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Address fields
  const [road, setRoad] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState<SwissCanton>(DEFAULT_CANTON_CODE);

  // Profile management state
  const [profileLabel, setProfileLabel] = useState('');
  const [profileMessage, setProfileMessage] = useState<ProfileMessage>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Apply a profile's data to form fields
  const applyProfile = (profile: DeliveryProfile) => {
    setCustomerName(profile.contactName);
    setCustomerPhone(profile.phone);
    setDeliveryType(profile.deliveryType);
    setRoad(profile.address.road);
    setHouseNumber(profile.address.houseNumber ?? '');
    setPostcode(profile.address.postcode);
    setCity(profile.address.city);
    setStateRegion(
      SWISS_CANTON_CODES.find((code) => code === profile.address.state) ?? DEFAULT_CANTON_CODE
    );
    setProfileLabel(profile.label ?? '');
    setProfileMessage(null);
  };

  // Auto-apply profile when selection changes
  useEffect(() => {
    if (!selectedProfileId) {
      return;
    }
    const profile = deliveryProfiles.find((item) => item.id === selectedProfileId);
    if (profile) {
      applyProfile(profile);
    }
  }, [selectedProfileId, deliveryProfiles]);

  // Auto-select first profile on mount
  useEffect(() => {
    if (deliveryProfiles.length > 0 && !selectedProfileId && !manualProfileClearRef.current) {
      const first = deliveryProfiles[0];
      setSelectedProfileId(first.id);
      applyProfile(first);
    }
  }, [deliveryProfiles, selectedProfileId]);

  const resolveProfileError = (error: unknown): string =>
    error instanceof ApiError ? error.message : t('orders.submit.saved.messages.genericError');

  const buildProfilePayload = (labelOverride?: string): DeliveryProfilePayload => ({
    label: (labelOverride ?? profileLabel).trim() || undefined,
    contactName: customerName,
    phone: customerPhone,
    deliveryType,
    address: {
      road,
      houseNumber: houseNumber || undefined,
      postcode,
      city,
      state: stateRegion,
      country: SWITZERLAND_COUNTRY,
    },
  });

  const ensureProfileFields = (): boolean => {
    if (!customerName || !customerPhone || !road || !postcode || !city) {
      setProfileMessage({ type: 'error', text: t('orders.submit.saved.messages.missingFields') });
      return false;
    }
    return true;
  };

  const ensureProfileLabel = (): boolean => {
    if (!profileLabel.trim()) {
      setProfileMessage({ type: 'error', text: t('orders.submit.saved.messages.missingLabel') });
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!ensureProfileFields() || !ensureProfileLabel()) {
      return;
    }
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const payload = buildProfilePayload();
      const profile = await createDeliveryProfile(payload);
      setDeliveryProfiles((prev) => [...prev, profile]);
      manualProfileClearRef.current = false;
      setSelectedProfileId(profile.id);
      setProfileMessage({ type: 'success', text: t('orders.submit.saved.messages.saved') });
    } catch (error) {
      setProfileMessage({ type: 'error', text: resolveProfileError(error) });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfileId) {
      setProfileMessage({ type: 'error', text: t('orders.submit.saved.messages.selectProfile') });
      return;
    }
    if (!ensureProfileFields() || !ensureProfileLabel()) {
      return;
    }
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const payload = buildProfilePayload();
      const profile = await updateDeliveryProfile(selectedProfileId, payload);
      setDeliveryProfiles((prev) => prev.map((item) => (item.id === profile.id ? profile : item)));
      setProfileMessage({ type: 'success', text: t('orders.submit.saved.messages.updated') });
    } catch (error) {
      setProfileMessage({ type: 'error', text: resolveProfileError(error) });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfileId) {
      setProfileMessage({ type: 'error', text: t('orders.submit.saved.messages.selectProfile') });
      return;
    }

    setProfileLoading(true);
    setProfileMessage(null);
    try {
      await deleteDeliveryProfile(selectedProfileId);
      setDeliveryProfiles((prev) => prev.filter((item) => item.id !== selectedProfileId));
      manualProfileClearRef.current = false;
      setSelectedProfileId('');
      setProfileLabel('');
      setProfileMessage({ type: 'success', text: t('orders.submit.saved.messages.deleted') });
    } catch (error) {
      setProfileMessage({ type: 'error', text: resolveProfileError(error) });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSelect = (profileId: string) => {
    manualProfileClearRef.current = false;
    setSelectedProfileId(profileId);
  };

  const handleClearProfileSelection = () => {
    manualProfileClearRef.current = true;
    setSelectedProfileId('');
  };

  return {
    // Payment and delivery state
    paymentMethod,
    setPaymentMethod,
    deliveryType,
    setDeliveryType,
    requestedFor,
    setRequestedFor,

    // Customer contact state
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,

    // Address state
    road,
    setRoad,
    houseNumber,
    setHouseNumber,
    postcode,
    setPostcode,
    city,
    setCity,
    stateRegion,
    setStateRegion,

    // Profile management state
    deliveryProfiles,
    selectedProfileId,
    profileLabel,
    setProfileLabel,
    profileMessage,
    profileLoading,

    // Profile management handlers
    handleProfileSelect,
    handleClearProfileSelection,
    handleSaveProfile,
    handleUpdateProfile,
    handleDeleteProfile,
  };
}
