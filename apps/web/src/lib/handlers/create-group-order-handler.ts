/**
 * Group order creation handler
 * Extracted logic for creating new orders
 */

import { createGroupOrder } from '@/lib/api/orders';
import type { CreateGroupOrderFormData } from '@/lib/types/form-data';
import { extractErrorMessage, isMultipleOrganizationsError } from '@/lib/utils/error-helpers';
import { parseFormData } from '@/lib/utils/form-data';
import { validateDates } from '@/lib/utils/order-date-utils';

export interface CreateGroupOrderResult {
  id: string;
  requiresOrganization?: boolean;
  errorKey?: string;
  errorMessage?: string;
}

/**
 * Handle group order creation with validation
 */
export async function handleCreateGroupOrder(request: Request): Promise<CreateGroupOrderResult> {
  const data = await parseFormData<CreateGroupOrderFormData>(request);
  const dateResult = validateDates(data.startDate, data.endDate);

  if (dateResult instanceof Response) {
    throw dateResult;
  }

  const { startDate, endDate } = dateResult;

  try {
    const created = await createGroupOrder({
      name: data.name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      organizationId: data.organizationId,
    });

    return { id: created.id };
  } catch (error) {
    if (isMultipleOrganizationsError(error)) {
      return {
        id: '',
        requiresOrganization: true,
        errorKey: 'errors.validation.failed',
        errorMessage: extractErrorMessage(error),
      };
    }
    throw error;
  }
}
