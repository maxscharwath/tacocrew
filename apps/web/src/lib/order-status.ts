export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'printed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Terminal states stop polling; `cancelled` is a bypass of the normal flow and is
// surfaced as a banner rather than a step.
export const TERMINAL_ORDER_STATUSES = [
  'delivered',
  'cancelled',
] as const satisfies readonly OrderStatus[];

export function isTerminalOrderStatus(status: OrderStatus | null | undefined): boolean {
  return status === 'delivered' || status === 'cancelled';
}

// Linear progression shown as stepper; `cancelled` is intentionally omitted.
// `printed` (kitchen ticket printed) sits between confirmation and prep.
export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'printed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
];

/**
 * Resolve an i18n-ready label for a status stage via the translation hook's `t`.
 * Falls back to a French default when a key is missing (francophone-first product).
 */
export function orderStatusLabelKey(status: OrderStatus): string {
  return `orders.progression.status.${status}`;
}
