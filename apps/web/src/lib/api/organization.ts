import { apiClient } from '@/lib/api/http';
import { resolveImageUrl } from '@/lib/api/image-utils';
import type {
  Organization,
  OrganizationMember,
  OrganizationPayload,
  OrganizationRole,
  PendingRequest,
} from '@/lib/api/types';

export function getMyOrganizations() {
  return apiClient.get<Organization[]>('/api/v1/users/me/organizations');
}

export function getAllOrganizations() {
  return apiClient.get<Organization[]>('/api/v1/organizations');
}

export function getOrganizationById(organizationId: string) {
  return apiClient.get<Organization>(`/api/v1/organizations/${organizationId}`);
}

export function createOrganization(body: OrganizationPayload) {
  return apiClient.post<Organization>('/api/v1/organizations', { body });
}

export function updateOrganization(organizationId: string, body: OrganizationPayload) {
  return apiClient.patch<Organization>(`/api/v1/organizations/${organizationId}`, { body });
}

export function deleteOrganization(organizationId: string) {
  return apiClient.delete<{ success: boolean }>(`/api/v1/organizations/${organizationId}`);
}

export function addUserToOrganization(
  organizationId: string,
  email: string,
  role?: OrganizationRole
) {
  return apiClient.post<{ success: boolean }>(`/api/v1/organizations/${organizationId}/users`, {
    body: { email, role },
  });
}

export function removeUserFromOrganization(organizationId: string, userId: string) {
  return apiClient.delete<{ success: boolean }>(
    `/api/v1/organizations/${organizationId}/users/${userId}`
  );
}

export function uploadOrganizationAvatar(
  organizationId: string,
  imageFile: File,
  backgroundColor?: string | null
) {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (backgroundColor && backgroundColor !== 'transparent') {
    formData.append('backgroundColor', backgroundColor);
  }
  return apiClient.post<Organization>(`/api/v1/organizations/${organizationId}/avatar`, {
    body: formData,
  });
}

export function deleteOrganizationAvatar(organizationId: string) {
  return apiClient.delete<Organization>(`/api/v1/organizations/${organizationId}/avatar`);
}

export function requestToJoinOrganization(organizationId: string) {
  return apiClient.post<{ success: boolean }>(`/api/v1/organizations/${organizationId}/join`);
}

export function getOrganizationMembers(organizationId: string) {
  return apiClient.get<OrganizationMember[]>(`/api/v1/organizations/${organizationId}/members`);
}

export function getPendingRequests(organizationId: string) {
  return apiClient.get<PendingRequest[]>(`/api/v1/organizations/${organizationId}/pending`);
}

export function acceptJoinRequest(organizationId: string, userId: string) {
  return apiClient.post<{ success: boolean }>(
    `/api/v1/organizations/${organizationId}/requests/${userId}/accept`
  );
}

export function rejectJoinRequest(organizationId: string, userId: string) {
  return apiClient.post<{ success: boolean }>(
    `/api/v1/organizations/${organizationId}/requests/${userId}/reject`
  );
}

export function updateUserRole(organizationId: string, userId: string, role: OrganizationRole) {
  return apiClient.patch<{ success: boolean }>(
    `/api/v1/organizations/${organizationId}/users/${userId}/role`,
    {
      body: { role },
    }
  );
}

/**
 * Get avatar image URL for an organization with optional size parameters
 */
export function getOrganizationAvatarUrl(
  organizationId: string,
  options?: { size?: number; w?: number; h?: number; dpr?: number }
): string {
  const path = `/api/v1/organizations/${organizationId}/avatar`;
  return resolveImageUrl(path, options) ?? path;
}
