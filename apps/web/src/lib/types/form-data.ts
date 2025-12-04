/**
 * TypeScript types for form data
 * @module lib/types/form-data
 *
 * Note: These types represent the raw form data structure (strings/arrays from FormData)
 * Conversion to proper types (numbers, dates, etc.) happens in action handlers
 */

/**
 * Form data for creating a group order
 */
export type CreateGroupOrderFormData = {
  name?: string;
  startDate: string;
  endDate: string;
  organizationId?: string;
};

/**
 * Form data for user order (adding a taco/order)
 * Note: FormData returns strings, so arrays are string[] and numbers are strings
 */
export type UserOrderFormData = {
  tacoSize: string;
  meats: string | string[];
  sauces: string | string[];
  garnitures: string | string[];
  extras: string | string[];
  drinks: string | string[];
  desserts: string | string[];
  note?: string;
  tacoQuantity: string;
};

/**
 * Form data for deleting a user order
 */
export type DeleteUserOrderFormData = {
  itemId: string;
};

/**
 * Form data for managing order status
 */
export type ManageOrderStatusFormData = {
  status: 'closed' | 'open' | 'submitted';
};

/**
 * Form data for submitting a group order
 */
export type SubmitGroupOrderFormData = {
  customerName: string;
  customerPhone: string;
  deliveryType: 'livraison' | 'emporter';
  road: string;
  houseNumber?: string;
  postcode: string;
  city: string;
  state?: string;
  country?: string;
  requestedFor: string;
  paymentMethod: 'especes' | 'carte' | 'twint';
};

/**
 * Form data for delivery form (used in orders.submit)
 */
export type DeliveryFormData = SubmitGroupOrderFormData & {
  dryRun?: string; // 'on' when checkbox is checked
};
