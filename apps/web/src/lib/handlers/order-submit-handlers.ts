/**
 * Order submission action handlers and utilities
 * Extracted handlers for clean route organization
 */

import { SWITZERLAND_COUNTRY } from '@/constants/location';
import { submitGroupOrder } from '@/lib/api';
import type { DeliveryFormData } from '@/lib/types/form-data';
import { parseFormData } from '@/lib/utils/form-data';

/**
 * Map API field paths to user-friendly field names
 */
export function getFieldLabel(
  fieldPath: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const fieldMap: Record<string, string> = {
    'customer.name': t('orders.submit.form.fields.customerName'),
    'customer.phone': t('orders.submit.form.fields.customerPhone'),
    'delivery.type': t('orders.submit.form.fields.deliveryType'),
    'delivery.address.road': t('orders.submit.form.fields.street'),
    'delivery.address.house_number': t('orders.submit.form.fields.houseNumber'),
    'delivery.address.postcode': t('orders.submit.form.fields.postcode'),
    'delivery.address.city': t('orders.submit.form.fields.city'),
    'delivery.address.state': t('orders.submit.form.fields.state'),
    'delivery.address.country': t('orders.submit.form.fields.country'),
    'delivery.requestedFor': t('orders.submit.form.fields.requestedFor'),
    paymentMethod: t('orders.submit.form.fields.paymentMethod'),
  };

  return fieldMap[fieldPath] || fieldPath;
}

/**
 * Handle group order submission
 */
export async function handleOrderSubmission(groupOrderId: string, request: Request): Promise<void> {
  const data = await parseFormData<DeliveryFormData>(request);
  const dryRun = data.dryRun === 'on';

  if (!data.paymentMethod) {
    throw new Response('Payment method is required', { status: 400 });
  }

  await submitGroupOrder(groupOrderId, {
    customer: {
      name: data.customerName,
      phone: data.customerPhone,
    },
    delivery: {
      type: data.deliveryType,
      address: {
        road: data.road,
        house_number: data.houseNumber,
        postcode: data.postcode,
        city: data.city,
        state: data.state,
        country: SWITZERLAND_COUNTRY,
      },
      requestedFor: data.requestedFor,
    },
    paymentMethod: data.paymentMethod,
    dryRun,
  });
}
