import { apiClient } from './http';

// ─────────────────────────────────────────────────────────────────────────────
// Pagination Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Page<T> {
  items: T[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPaginationParams {
  limit?: number;
  cursor?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  readAt: string | null;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

export function getNotifications(
  options?: CursorPaginationParams & { archived?: boolean }
): Promise<Page<Notification>> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.cursor) params.set('cursor', options.cursor);
  if (options?.archived !== undefined) params.set('archived', options.archived.toString());
  const query = params.toString();
  return apiClient.get<Page<Notification>>(`/api/v1/notifications${query ? `?${query}` : ''}`);
}

export function getUnreadCount() {
  return apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count');
}

export function markAsRead(notificationId: string) {
  return apiClient.patch<Notification>(`/api/v1/notifications/${notificationId}/read`);
}

export function markAllAsRead() {
  return apiClient.post<{ success: boolean; count: number }>('/api/v1/notifications/mark-all-read');
}

export function archiveNotification(notificationId: string) {
  return apiClient.patch<Notification>(`/api/v1/notifications/${notificationId}/archive`);
}

export function archiveAllNotifications() {
  return apiClient.post<{ success: boolean; count: number }>('/api/v1/notifications/archive-all');
}

export function sendPaymentReminder(groupOrderId: string, userOrderId: string) {
  return apiClient.post<{ success: boolean }>(
    `/api/v1/orders/${groupOrderId}/items/${userOrderId}/reimbursement/reminder`
  );
}
