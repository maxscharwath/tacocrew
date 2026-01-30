import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { badgesKeys } from '@/lib/api/badges';
import { apiClient } from '@/lib/api/http';
import type {
  CreateGroupOrderBody,
  GroupOrder,
  GroupOrderSubmissionBody,
  GroupOrderSubmissionResponse,
  GroupOrderWithUserOrders,
  UpsertUserOrderBody,
  UserOrderDetail,
  UserOrderItems,
  UserOrderResponse,
} from '@/lib/api/types';
import { userKeys } from '@/lib/api/user';

/** Query key factory for orders */
export const ordersKeys = {
  all: () => ['orders'] as const,
  lists: () => [...ordersKeys.all(), 'list'] as const,
  list: () => [...ordersKeys.lists()] as const,
  details: () => [...ordersKeys.all(), 'detail'] as const,
  detail: (id: string) => [...ordersKeys.details(), id] as const,
  receipts: (id: string) => [...ordersKeys.all(), 'receipts', id] as const,
  cookies: (id: string) => [...ordersKeys.all(), 'cookies', id] as const,
  userOrders: () => [...ordersKeys.all(), 'userOrders'] as const,
  userOrder: (groupOrderId: string, itemId: string) =>
    [...ordersKeys.userOrders(), groupOrderId, itemId] as const,
} as const;

export type {
  CreateGroupOrderBody,
  GroupOrder,
  GroupOrderSubmissionBody,
  GroupOrderSubmissionResponse,
  GroupOrderWithUserOrders,
  UpsertUserOrderBody,
  UserOrderDetail,
  UserOrderResponse,
} from '@/lib/api/types';

export interface UpdateGroupOrderBody {
  name?: string | null;
  startDate?: string;
  endDate?: string;
}

export interface OrderCookiesResponse {
  cookies: Record<string, string>;
  csrfToken: string;
  orderId?: string;
  transactionId?: string;
  sessionId?: string;
  cookieString: string;
  instructions: string;
}

/**
 * Raw API functions for server-side handlers and services
 * These should only be used outside React components where hooks cannot be used
 */
export function getGroupOrderWithOrders(groupOrderId: string) {
  return apiClient.get<GroupOrderWithUserOrders>(`/api/v1/orders/${groupOrderId}/items`);
}

export function createGroupOrder(body: CreateGroupOrderBody) {
  return apiClient.post<GroupOrder>('/api/v1/orders', { body });
}

export function submitGroupOrder(groupOrderId: string, body: GroupOrderSubmissionBody) {
  return apiClient.post<GroupOrderSubmissionResponse>(`/api/v1/orders/${groupOrderId}/submit`, {
    body,
  });
}

export function upsertUserOrder(groupOrderId: string, body: UpsertUserOrderBody) {
  return apiClient.post<UserOrderResponse>(`/api/v1/orders/${groupOrderId}/items`, { body });
}

export function deleteUserOrder(groupOrderId: string, itemId: string) {
  return apiClient.delete<void>(`/api/v1/orders/${groupOrderId}/items/${itemId}`);
}

export function updateGroupOrderStatus(
  groupOrderId: string,
  status: 'open' | 'closed' | 'submitted'
) {
  return apiClient.post<GroupOrder>(`/api/v1/orders/${groupOrderId}/status`, { body: { status } });
}

export function useCreateGroupOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupOrderBody) =>
      apiClient.post<GroupOrder>('/api/v1/orders', { body }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      // Invalidate the new order detail if we have the ID
      if (data.id) {
        void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(data.id) });
      }
      // Invalidate user group orders since creating an order affects the user's list
      void queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
    },
  });
}

export function useGroupOrder(id: string, enabled = true) {
  return useQuery<GroupOrder>({
    queryKey: ordersKeys.detail(id),
    queryFn: () => apiClient.get<GroupOrder>(`/api/v1/orders/${id}`),
    enabled: enabled && !!id,
  });
}

export function useGroupOrderWithOrders(id: string, enabled = true) {
  return useQuery<GroupOrderWithUserOrders>({
    queryKey: ordersKeys.detail(id),
    queryFn: () => apiClient.get<GroupOrderWithUserOrders>(`/api/v1/orders/${id}/items`),
    enabled: enabled && !!id,
    refetchOnMount: 'always', // Always refetch when component mounts to see latest data
  });
}

export function useGroupOrderReceipts(groupOrderId: string, enabled = true) {
  return useQuery<GroupOrderWithUserOrders>({
    queryKey: ordersKeys.receipts(groupOrderId),
    queryFn: () =>
      apiClient.get<GroupOrderWithUserOrders>(`/api/v1/orders/${groupOrderId}/receipts`),
    enabled: enabled && !!groupOrderId,
    staleTime: 0,
  });
}

export function useRevealMysteryTacos(
  groupOrderId: string,
  userOrderId: string,
  onSuccess?: (data: UserOrderItems) => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.get<UserOrderItems>(
        `/api/v1/orders/${groupOrderId}/items/${userOrderId}/reveal-mystery`
      ),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ordersKeys.userOrder(groupOrderId, userOrderId),
      });
      // Revealing mystery tacos affects the order detail view
      void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(groupOrderId) });
      onSuccess?.(data);
    },
  });
}

export function useUpsertUserOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupOrderId, body }: { groupOrderId: string; body: UpsertUserOrderBody }) =>
      apiClient.post<UserOrderResponse>(`/api/v1/orders/${groupOrderId}/items`, { body }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(variables.groupOrderId) });
      // Upserting user orders affects receipts view
      void queryClient.invalidateQueries({ queryKey: ordersKeys.receipts(variables.groupOrderId) });
      // Badges can be earned when orders are created/updated
      void queryClient.invalidateQueries({ queryKey: badgesKeys.userBadges('me') });
      // User order history may be affected
      void queryClient.invalidateQueries({ queryKey: userKeys.orderHistory() });
      void queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
    },
  });
}

export function useUserOrder(groupOrderId: string, itemId: string, enabled = true) {
  return useQuery<UserOrderDetail>({
    queryKey: ordersKeys.userOrder(groupOrderId, itemId),
    queryFn: () => apiClient.get<UserOrderDetail>(`/api/v1/orders/${groupOrderId}/items/${itemId}`),
    enabled: enabled && !!groupOrderId && !!itemId,
  });
}

export function useDeleteUserOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupOrderId, itemId }: { groupOrderId: string; itemId: string }) =>
      apiClient.delete<void>(`/api/v1/orders/${groupOrderId}/items/${itemId}`),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(variables.groupOrderId) });
      // Deleting user orders affects receipts view
      void queryClient.invalidateQueries({ queryKey: ordersKeys.receipts(variables.groupOrderId) });
      // User order history may be affected
      void queryClient.invalidateQueries({ queryKey: userKeys.orderHistory() });
      void queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
    },
  });
}

export function useUpdateUserOrderReimbursementStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupOrderId,
      itemId,
      reimbursed,
    }: {
      groupOrderId: string;
      itemId: string;
      reimbursed: boolean;
    }) =>
      apiClient.patch<UserOrderResponse>(
        `/api/v1/orders/${groupOrderId}/items/${itemId}/reimbursement`,
        { body: { reimbursed } }
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.receipts(variables.groupOrderId) });
      void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(variables.groupOrderId) });
      // Badges can be earned when paying for others (reimbursement status change)
      void queryClient.invalidateQueries({ queryKey: badgesKeys.userBadges('me') });
    },
  });
}

export function useUpdateUserOrderParticipantPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupOrderId,
      itemId,
      paid,
    }: {
      groupOrderId: string;
      itemId: string;
      paid: boolean;
    }) =>
      apiClient.patch<UserOrderResponse>(`/api/v1/orders/${groupOrderId}/items/${itemId}/payment`, {
        body: { paid },
      }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.receipts(variables.groupOrderId) });
      void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(variables.groupOrderId) });
      // Payment status changes might affect badge eligibility
      void queryClient.invalidateQueries({ queryKey: badgesKeys.userBadges('me') });
    },
  });
}

export function useDeleteGroupOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupOrderId: string) => apiClient.delete<void>(`/api/v1/orders/${groupOrderId}`),
    onSuccess: (_, groupOrderId) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      // Remove the deleted order detail from cache
      queryClient.removeQueries({ queryKey: ordersKeys.detail(groupOrderId) });
      // User group orders list is affected
      void queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
      void queryClient.invalidateQueries({ queryKey: userKeys.orderHistory() });
    },
  });
}

export function useSubmitGroupOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupOrderId,
      body,
    }: {
      groupOrderId: string;
      body: GroupOrderSubmissionBody;
    }) =>
      apiClient.post<GroupOrderSubmissionResponse>(`/api/v1/orders/${groupOrderId}/submit`, {
        body,
      }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(variables.groupOrderId) });
      // Submitting an order changes its status, which affects list views
      void queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      // User group orders list is affected
      void queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
      void queryClient.invalidateQueries({ queryKey: userKeys.orderHistory() });
    },
  });
}

export function useUpdateGroupOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupOrderId,
      status,
    }: {
      groupOrderId: string;
      status: 'open' | 'closed' | 'submitted';
    }) => apiClient.post<GroupOrder>(`/api/v1/orders/${groupOrderId}/status`, { body: { status } }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(variables.groupOrderId) });
      // Status changes affect list views
      void queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      // User group orders list is affected
      void queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
    },
  });
}

export function useUpdateGroupOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupOrderId, body }: { groupOrderId: string; body: UpdateGroupOrderBody }) =>
      apiClient.patch<GroupOrder>(`/api/v1/orders/${groupOrderId}`, { body }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(variables.groupOrderId) });
      // Updates to group order (name, dates) affect the orders list
      void queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
    },
  });
}

export function useOrderCookies(groupOrderId: string, enabled = true) {
  return useQuery<OrderCookiesResponse>({
    queryKey: ordersKeys.cookies(groupOrderId),
    queryFn: () => apiClient.get<OrderCookiesResponse>(`/api/v1/orders/${groupOrderId}/cookies`),
    enabled: enabled && !!groupOrderId,
  });
}
