import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CANTON_CODE, SWITZERLAND_COUNTRY, type SwissCanton } from '@/constants/location';
import { useZodForm } from '@/hooks/useZodForm';
import { ApiError } from '@/lib/api/http';
import type { DeliveryProfile, DeliveryProfilePayload } from '@/lib/api/types';
import {
  useCreateDeliveryProfile,
  useDeleteDeliveryProfile,
  useUpdateDeliveryProfile,
} from '@/lib/api/user';
import { DeliveryFormSchema } from '@/lib/schemas/delivery-form.schema';

type ProfileMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

type UseDeliveryFormProps = {
  readonly initialProfiles: DeliveryProfile[];
};

export function useDeliveryForm({ initialProfiles }: UseDeliveryFormProps) {
  const { t } = useTranslation();
  const form = useZodForm({
    schema: DeliveryFormSchema,
    defaultValues: {
      customerName: '',
      customerPhone: '',
      deliveryType: 'livraison',
      road: '',
      houseNumber: '',
      postcode: '',
      city: '',
      stateRegion: DEFAULT_CANTON_CODE,
      requestedFor: '',
      paymentMethod: 'especes',
    },
  });

  // Delivery profiles state
  const [deliveryProfiles, setDeliveryProfiles] = useState(initialProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfiles[0]?.id ?? '');
  const manualProfileClearRef = useRef(false);

  // Profile management state
  const [profileLabel, setProfileLabel] = useState('');
  const [profileMessage, setProfileMessage] = useState<ProfileMessage>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Mutation hooks for profile operations with automatic cache invalidation
  const createMutation = useCreateDeliveryProfile();
  const updateMutation = useUpdateDeliveryProfile();
  const deleteMutation = useDeleteDeliveryProfile();

  // Update profiles when initialProfiles prop changes (e.g., after async fetch)
  useEffect(() => {
    setDeliveryProfiles(initialProfiles);
    // Auto-select first profile if no selection and profiles are available
    if (initialProfiles.length > 0 && !selectedProfileId && !manualProfileClearRef.current) {
      setSelectedProfileId(initialProfiles[0].id);
    }
  }, [initialProfiles]);

  // Apply a profile's data to form fields
  const applyProfile = (profile: DeliveryProfile) => {
    form.setValue('customerName', profile.contactName);
    form.setValue('customerPhone', profile.phone);
    form.setValue('deliveryType', profile.deliveryType);
    form.setValue('road', profile.address.road);
    form.setValue('houseNumber', profile.address.houseNumber ?? '');
    form.setValue('postcode', profile.address.postcode);
    form.setValue('city', profile.address.city);
    form.setValue('stateRegion', profile.address.state);
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

  const buildProfilePayload = (labelOverride?: string): DeliveryProfilePayload => {
    const formData = form.getValues();
    return {
      label: (labelOverride ?? profileLabel).trim() || undefined,
      contactName: formData.customerName,
      phone: formData.customerPhone,
      deliveryType: formData.deliveryType,
      address: {
        road: formData.road,
        houseNumber: formData.houseNumber || undefined,
        postcode: formData.postcode,
        city: formData.city,
        state: formData.stateRegion as SwissCanton,
        country: SWITZERLAND_COUNTRY,
      },
    };
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const payload = buildProfilePayload();
      const profile = await createMutation.mutateAsync(payload);
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
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const payload = buildProfilePayload();
      const profile = await updateMutation.mutateAsync({ id: selectedProfileId, body: payload });
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
      await deleteMutation.mutateAsync(selectedProfileId);
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
    // React Hook Form object - use form.register(), form.watch(), form.getValues()
    form,

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
