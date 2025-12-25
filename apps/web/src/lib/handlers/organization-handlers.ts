/**
 * Organization action handlers
 * Handlers for organization creation, update, and deletion
 */

import { toast } from '@tacocrew/ui-kit';
import { createOrganization } from '@/lib/api/organization';
import type { OrganizationPayload } from '@/lib/api/types';

export interface OrganizationCreateOptions {
  onSuccess: (orgId: string) => void;
  onError: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Handle organization creation
 */
export async function handleCreateOrganization(
  data: OrganizationPayload,
  avatarFile: File | null,
  backgroundColor: string | null,
  options: OrganizationCreateOptions
): Promise<void> {
  const loadingToastId = toast.loading(options.t('organizations.messages.creating'));

  try {
    const newOrg = await createOrganization(data, avatarFile, backgroundColor);
    toast.success(options.t('organizations.messages.createdWithName', { name: newOrg.name }), {
      id: loadingToastId,
    });
    options.onSuccess(newOrg.id);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : options.t('organizations.messages.genericError');
    toast.error(options.t('organizations.messages.createFailed', { error: errorMessage }), {
      id: loadingToastId,
    });
    options.onError();
    throw error; // Re-throw so form can handle it
  }
}
