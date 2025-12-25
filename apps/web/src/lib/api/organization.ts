import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function createOrganization(
  body: OrganizationPayload,
  avatarFile?: File | null,
  backgroundColor?: string | null
) {
  if (avatarFile) {
    const formData = new FormData();
    formData.append('name', body.name);
    formData.append('image', avatarFile);
    if (backgroundColor && backgroundColor !== 'transparent') {
      formData.append('backgroundColor', backgroundColor);
    }
    return apiClient.post<Organization>('/api/v1/organizations', { body: formData });
  }
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

export function getOrganizationAvatarUrl(
  organizationId: string,
  options?: { size?: number; w?: number; h?: number; dpr?: number }
): string {
  const path = `/api/v1/organizations/${organizationId}/avatar`;
  return resolveImageUrl(path, options) ?? path;
}

export function useMyOrganizations(enabled = true) {
  return useQuery<Organization[]>({
    queryKey: ['myOrganizations'],
    queryFn: () => getMyOrganizations(),
    enabled,
  });
}

export function useAllOrganizations(enabled = true) {
  return useQuery<Organization[]>({
    queryKey: ['allOrganizations'],
    queryFn: () => getAllOrganizations(),
    enabled,
  });
}

export function useOrganization(organizationId: string, enabled = true) {
  return useQuery<Organization>({
    queryKey: ['organization', organizationId],
    queryFn: () => getOrganizationById(organizationId),
    enabled: enabled && !!organizationId,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      avatarFile,
      backgroundColor,
    }: {
      body: OrganizationPayload;
      avatarFile?: File | null;
      backgroundColor?: string | null;
    }) => createOrganization(body, avatarFile, backgroundColor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['allOrganizations'] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, body }: { organizationId: string; body: OrganizationPayload }) =>
      updateOrganization(organizationId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['allOrganizations'] });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) => deleteOrganization(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['allOrganizations'] });
    },
  });
}

export function useAddUserToOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      email,
      role,
    }: {
      organizationId: string;
      email: string;
      role?: OrganizationRole;
    }) => addUserToOrganization(organizationId, email, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organizationMembers', variables.organizationId],
      });
    },
  });
}

export function useRemoveUserFromOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      removeUserFromOrganization(organizationId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organizationMembers', variables.organizationId],
      });
    },
  });
}

export function useUploadOrganizationAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      imageFile,
      backgroundColor,
    }: {
      organizationId: string;
      imageFile: File;
      backgroundColor?: string | null;
    }) => uploadOrganizationAvatar(organizationId, imageFile, backgroundColor),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['allOrganizations'] });
    },
  });
}

export function useDeleteOrganizationAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) => deleteOrganizationAvatar(organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization', variables] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['allOrganizations'] });
    },
  });
}

export function useRequestToJoinOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) => requestToJoinOrganization(organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests', variables] });
    },
  });
}

export function useOrganizationMembers(organizationId: string, enabled = true) {
  return useQuery<OrganizationMember[]>({
    queryKey: ['organizationMembers', organizationId],
    queryFn: () => getOrganizationMembers(organizationId),
    enabled: enabled && !!organizationId,
  });
}

export function usePendingRequests(organizationId: string, enabled = true) {
  return useQuery<PendingRequest[]>({
    queryKey: ['pendingRequests', organizationId],
    queryFn: () => getPendingRequests(organizationId),
    enabled: enabled && !!organizationId,
  });
}

export function useAcceptJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      acceptJoinRequest(organizationId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests', variables.organizationId] });
      queryClient.invalidateQueries({
        queryKey: ['organizationMembers', variables.organizationId],
      });
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      rejectJoinRequest(organizationId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests', variables.organizationId] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
      role,
    }: {
      organizationId: string;
      userId: string;
      role: OrganizationRole;
    }) => updateUserRole(organizationId, userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organizationMembers', variables.organizationId],
      });
    },
  });
}
