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

const organizationKeys = {
  all: () => ['organizations'] as const,
  myOrganizations: () => [...organizationKeys.all(), 'my'] as const,
  allOrganizations: () => [...organizationKeys.all(), 'list'] as const,
  detail: (id: string) => [...organizationKeys.all(), 'detail', id] as const,
  members: (id: string) => [...organizationKeys.all(), 'members', id] as const,
  pendingRequests: (id: string) => [...organizationKeys.all(), 'pending', id] as const,
};

export function getOrganizationAvatarUrl(
  organizationId: string,
  options?: { size?: number; w?: number; h?: number; dpr?: number }
): string {
  const path = `/api/v1/organizations/${organizationId}/avatar`;
  return resolveImageUrl(path, options) ?? path;
}

export function requestToJoinOrganization(organizationId: string) {
  return apiClient.post<{ success: boolean }>(`/api/v1/organizations/${organizationId}/join`);
}

export function useMyOrganizations(enabled = true) {
  return useQuery<Organization[]>({
    queryKey: organizationKeys.myOrganizations(),
    queryFn: () => apiClient.get<Organization[]>('/api/v1/users/me/organizations'),
    enabled,
  });
}

export function useAllOrganizations(enabled = true) {
  return useQuery<Organization[]>({
    queryKey: organizationKeys.allOrganizations(),
    queryFn: () => apiClient.get<Organization[]>('/api/v1/organizations'),
    enabled,
  });
}

export function useOrganization(organizationId: string, enabled = true) {
  return useQuery<Organization>({
    queryKey: organizationKeys.detail(organizationId),
    queryFn: () => apiClient.get<Organization>(`/api/v1/organizations/${organizationId}`),
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
    }) => {
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
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.myOrganizations() });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.allOrganizations() });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, body }: { organizationId: string; body: OrganizationPayload }) =>
      apiClient.patch<Organization>(`/api/v1/organizations/${organizationId}`, { body }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.organizationId),
      });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.myOrganizations() });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.allOrganizations() });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) =>
      apiClient.delete<{ success: boolean }>(`/api/v1/organizations/${organizationId}`),
    onSuccess: (_, organizationId) => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.myOrganizations() });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.allOrganizations() });
      queryClient.removeQueries({ queryKey: organizationKeys.detail(organizationId) });
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
    }) =>
      apiClient.post<{ success: boolean }>(`/api/v1/organizations/${organizationId}/users`, {
        body: { email, role },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(variables.organizationId),
      });
      // Adding a user might affect myOrganizations if the added user is the current user
      // We invalidate to be safe (the backend might auto-add in some cases)
      void queryClient.invalidateQueries({ queryKey: organizationKeys.myOrganizations() });
    },
  });
}

export function useRemoveUserFromOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      apiClient.delete<{ success: boolean }>(
        `/api/v1/organizations/${organizationId}/users/${userId}`
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.members(variables.organizationId),
      });
      // Removing a user might affect myOrganizations if the removed user is the current user
      // We invalidate to be safe
      void queryClient.invalidateQueries({ queryKey: organizationKeys.myOrganizations() });
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
    }) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (backgroundColor && backgroundColor !== 'transparent') {
        formData.append('backgroundColor', backgroundColor);
      }
      return apiClient.post<Organization>(`/api/v1/organizations/${organizationId}/avatar`, {
        body: formData,
      });
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.organizationId),
      });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.myOrganizations() });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.allOrganizations() });
    },
  });
}

export function useDeleteOrganizationAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) =>
      apiClient.delete<Organization>(`/api/v1/organizations/${organizationId}/avatar`),
    onSuccess: (_, organizationId) => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.detail(organizationId) });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.myOrganizations() });
      void queryClient.invalidateQueries({ queryKey: organizationKeys.allOrganizations() });
    },
  });
}

export function useRequestToJoinOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) =>
      apiClient.post<{ success: boolean }>(`/api/v1/organizations/${organizationId}/join`),
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.pendingRequests(organizationId) });
    },
  });
}

export function useOrganizationMembers(organizationId: string, enabled = true) {
  return useQuery<OrganizationMember[]>({
    queryKey: organizationKeys.members(organizationId),
    queryFn: () =>
      apiClient.get<OrganizationMember[]>(`/api/v1/organizations/${organizationId}/members`),
    enabled: enabled && !!organizationId,
  });
}

export function usePendingRequests(organizationId: string, enabled = true) {
  return useQuery<PendingRequest[]>({
    queryKey: organizationKeys.pendingRequests(organizationId),
    queryFn: () =>
      apiClient.get<PendingRequest[]>(`/api/v1/organizations/${organizationId}/pending`),
    enabled: enabled && !!organizationId,
  });
}

export function useAcceptJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      apiClient.post<{ success: boolean }>(
        `/api/v1/organizations/${organizationId}/requests/${userId}/accept`
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.pendingRequests(variables.organizationId),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.members(variables.organizationId),
      });
      // Accepting a join request adds the user to the org, affecting myOrganizations
      void queryClient.invalidateQueries({ queryKey: organizationKeys.myOrganizations() });
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      apiClient.post<{ success: boolean }>(
        `/api/v1/organizations/${organizationId}/requests/${userId}/reject`
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.pendingRequests(variables.organizationId),
      });
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
    }) =>
      apiClient.patch<{ success: boolean }>(
        `/api/v1/organizations/${organizationId}/users/${userId}/role`,
        {
          body: { role },
        }
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.members(variables.organizationId),
      });
    },
  });
}
