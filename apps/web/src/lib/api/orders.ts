import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

/** Internal query key factory for orders */
const ordersKeys = {
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
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
    },
  });
}

export function useDeleteGroupOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupOrderId: string) => apiClient.delete<void>(`/api/v1/orders/${groupOrderId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
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
