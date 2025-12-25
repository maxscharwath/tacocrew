/**
 * Group order ID extraction utilities
 * Centralized place for extracting group order ID from different sources
 */

/**
 * Get group order ID from route params
 * Throws 404 if not found
 */
export function getGroupOrderIdFromParams(params?: Record<string, string | undefined>): string {
  const groupOrderId = params?.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }
  return groupOrderId;
}

/**
 * Get group order ID from request URL path
 * Throws 404 if not found
 */
export function getGroupOrderIdFromUrl(url: URL): string {
  const groupOrderId = url.pathname.split('/').pop();
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }
  return groupOrderId;
}
