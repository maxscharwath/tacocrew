/**
 * Core type definitions for the Tacos Ordering API
 * @module types
 */

export type { CartId } from '../../schemas/cart.schema';
export type { Dessert, DessertId } from '../../schemas/dessert.schema';
export { DessertIdSchema } from '../../schemas/dessert.schema';
export type { Drink, DrinkId } from '../../schemas/drink.schema';
export { DrinkIdSchema } from '../../schemas/drink.schema';
export type { Extra, ExtraId, FreeSauce } from '../../schemas/extra.schema';
export { ExtraIdSchema } from '../../schemas/extra.schema';
export type { GroupOrderId } from '../../schemas/group-order.schema';
export type { OrderId } from '../../schemas/order.schema';
export type { SessionId } from '../../schemas/session.schema';
export type {
  Garniture,
  Meat,
  Sauce,
  Taco,
} from '../../schemas/taco.schema';
export type { UserId } from '../../schemas/user.schema';
export type { UserOrderId } from '../../schemas/user-order.schema';
export * from './api';
export * from './session';

/**
 * Taco size options with their meat capacity
 */
export enum TacoSize {
  L = 'tacos_L',
  BOWL = 'tacos_BOWL',
  L_MIXTE = 'tacos_L_mixte',
  XL = 'tacos_XL',
  XXL = 'tacos_XXL',
  GIGA = 'tacos_GIGA',
}

/**
 * Order type (delivery or takeaway)
 */
export enum OrderType {
  DELIVERY = 'livraison',
  TAKEAWAY = 'emporter',
}

/**
 * Order status lifecycle
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ON_DELIVERY = 'ondelivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

// Meat, Sauce, Garniture, and Taco types are now exported from @/schemas/taco.schema

/**
 * Request to add a taco to cart
 */
export interface AddTacoRequest {
  size: TacoSize;
  meats: Array<{ id: string; quantity: number }>;
  sauces: string[];
  garnitures: string[];
  note?: string;
}

/**
 * Request to update a taco
 */
export interface UpdateTacoRequest extends AddTacoRequest {
  id: string;
}

// Extra, Drink, and Dessert types are now exported from their respective domain schemas

/**
 * Cart summary by category
 */
export interface CategorySummary {
  totalQuantity: number;
  totalPrice: number;
}

/**
 * Complete cart summary
 */
export interface CartSummary {
  tacos: CategorySummary;
  extras: CategorySummary;
  boissons: CategorySummary;
  desserts: CategorySummary;
  total: {
    quantity: number;
    price: number;
  };
}

/**
 * Cart metadata with session data
 * CSRF tokens are fetched fresh for each request using stored cookies
 */
export interface CartMetadata {
  /** HTTP cookies for this cart session (session identifier) */
  cookies: Record<string, string>;
  /** Cart creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivityAt: Date;
  /** Optional metadata */
  metadata?: {
    ip?: string;
    userAgent?: string;
    [key: string]: unknown;
  };
}

import { CartId } from '../../schemas/cart.schema';
// Import types from domain schemas for use in this file
import type { Dessert } from '../../schemas/dessert.schema';
import type { Drink } from '../../schemas/drink.schema';
import type { Extra } from '../../schemas/extra.schema';
import { GroupOrderId } from '../../schemas/group-order.schema';
import type { Taco } from '../../schemas/taco.schema';
import { UserId } from '../../schemas/user.schema';
import { UserOrderId } from '../../schemas/user-order.schema';
import type { TimeSlot } from './time-slot';

/**
 * Complete cart contents with session data
 */
export interface Cart {
  /** Cart ID (session ID) */
  cartId: CartId;
  /** Session data (CSRF token, cookies, etc.) */
  session: CartMetadata;
  tacos: Taco[];
  extras: Extra[];
  drinks: Drink[];
  desserts: Dessert[];
  summary: CartSummary;
}

/**
 * Stock item with deterministic UUID id and stock code
 * Application/domain type (internal format)
 */
export interface StockItem {
  /** Deterministic UUID generated from code */
  id: string;
  /** Stock item code (original identifier) */
  code: string;
  name: string;
  price: number;
  in_stock: boolean;
}

/**
 * Stock category enum
 */
export enum StockCategory {
  Meats = 'meats',
  Sauces = 'sauces',
  Garnishes = 'garnishes',
  Desserts = 'desserts',
  Drinks = 'drinks',
  Extras = 'extras',
}

/**
 * Taco size information
 */
export interface TacoSizeItem {
  id: string;
  code: TacoSize;
  name: string;
  price: number;
  maxMeats: number;
  maxSauces: number;
  allowGarnitures: boolean;
}

/**
 * Stock availability for all product categories (API format - arrays)
 * Uses StockCategory enum values as keys
 */
export type StockAvailability = {
  [K in StockCategory]: StockItem[];
} & {
  tacos: TacoSizeItem[];
};

// Resource types moved to api.ts (backend API types)

/**
 * Structured address information
 * Based on OpenStreetMap Nominatim address format
 */
export interface StructuredAddress {
  road: string;
  house_number?: string;
  postcode: string;
  city: string;
  state?: string;
  country?: string;
}

/**
 * Customer information
 */
export interface Customer {
  name: string; // Can be person name or company/enterprise name
  phone: string;
}

/**
 * Delivery information
 */
export interface DeliveryInfo {
  type: OrderType;
  address: StructuredAddress;
  requestedFor: TimeSlot; // Time slot in HH:MM format (e.g., "15:00")
}

/**
 * Order creation request
 */
export interface CreateOrderRequest {
  customer: Customer;
  delivery: DeliveryInfo;
}

// OrderData moved to api.ts (backend API type)
// For application use, prefer the Order domain schema from @/schemas/order.schema

/**
 * Time slot with demand information
 */
export interface TimeSlotWithDemand {
  time: string;
  available: boolean;
  highDemand: boolean;
}

/**
 * Delivery demand information
 */
export interface DeliveryDemand {
  time: string;
  isHighDemand: boolean;
  message?: string;
}

// CsrfTokenResponse moved to api.ts (backend API type)

/**
 * API error response
 */
export interface ApiError {
  id: string;
  code: string;
  key: string;
  details?: Record<string, unknown>;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Taco size configuration
 */
export interface TacoSizeConfig {
  maxMeats: number;
  maxSauces: number;
  allowGarnitures: boolean;
}

/**
 * Taco size configurations map
 */
export const TACO_SIZE_CONFIG: Record<TacoSize, TacoSizeConfig> = {
  [TacoSize.L]: { maxMeats: 1, maxSauces: 3, allowGarnitures: true },
  [TacoSize.BOWL]: { maxMeats: 2, maxSauces: 3, allowGarnitures: true },
  [TacoSize.L_MIXTE]: { maxMeats: 3, maxSauces: 3, allowGarnitures: true },
  [TacoSize.XL]: { maxMeats: 3, maxSauces: 3, allowGarnitures: true },
  [TacoSize.XXL]: { maxMeats: 4, maxSauces: 3, allowGarnitures: true },
  [TacoSize.GIGA]: { maxMeats: 5, maxSauces: 3, allowGarnitures: true },
};

/**
 * Group order status
 */
export enum GroupOrderStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SUBMITTED = 'submitted',
  COMPLETED = 'completed',
}

/**
 * User order status within a group order
 */
export enum UserOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

/**
 * User order items (all items in a user's order)
 */
export interface UserOrderItems {
  tacos: Taco[];
  extras: Extra[];
  drinks: Drink[];
  desserts: Dessert[];
}

/**
 * User order within a group order
 */
export interface UserOrder {
  id: UserOrderId;
  groupOrderId: GroupOrderId;
  userId: UserId;
  username?: string; // Optional for backward compatibility
  status: UserOrderStatus;
  items: UserOrderItems;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Group order
 */
export interface GroupOrder {
  id: GroupOrderId;
  name?: string;
  leader: UserId; // User ID of the group order leader
  startDate: Date;
  endDate: Date;
  status: GroupOrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Group order with user orders
 */
export interface GroupOrderWithUserOrders extends GroupOrder {
  userOrders: UserOrder[];
}

/**
 * Create group order request
 */
export interface CreateGroupOrderRequest {
  name?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

/**
 * Update user order request
 */
export interface UpdateUserOrderRequest {
  items: UserOrderItems;
}

/**
 * Submit group order request
 */
export interface SubmitGroupOrderRequest {
  customer: Customer;
  delivery: DeliveryInfo;
}

/**
 * Error code definitions with both code and translation key
 */
export const ErrorCodes = {
  CSRF_INVALID: { code: 'CSRF_INVALID', key: 'errors.csrf.invalid' },
  RATE_LIMIT: { code: 'RATE_LIMIT', key: 'errors.rateLimit.exceeded' },
  DUPLICATE_ORDER: { code: 'DUPLICATE_ORDER', key: 'errors.order.duplicate' },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', key: 'errors.validation.failed' },
  OUT_OF_STOCK: { code: 'OUT_OF_STOCK', key: 'errors.stock.outOfStock' },
  NOT_FOUND: { code: 'NOT_FOUND', key: 'errors.notFound.generic' },
  NETWORK_ERROR: { code: 'NETWORK_ERROR', key: 'errors.network.failed' },
  SESSION_NOT_FOUND: { code: 'SESSION_NOT_FOUND', key: 'errors.session.notFound' },
  SESSION_EXPIRED: { code: 'SESSION_EXPIRED', key: 'errors.session.expired' },
  UNKNOWN_ERROR: { code: 'UNKNOWN_ERROR', key: 'errors.unknown.generic' },
  FORBIDDEN: { code: 'FORBIDDEN', key: 'errors.forbidden.generic' },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', key: 'errors.unauthorized.generic' },
  // Better Auth passkey errors
  PASSKEY_NOT_FOUND: { code: 'PASSKEY_NOT_FOUND', key: 'errors.auth.passkey.notFound' },
  CHALLENGE_NOT_FOUND: {
    code: 'CHALLENGE_NOT_FOUND',
    key: 'errors.auth.passkey.challengeNotFound',
  },
  PASSKEY_REGISTRATION_NOT_ALLOWED: {
    code: 'YOU_ARE_NOT_ALLOWED_TO_REGISTER_THIS_PASSKEY',
    key: 'errors.auth.passkey.registrationNotAllowed',
  },
  PASSKEY_VERIFICATION_FAILED: {
    code: 'FAILED_TO_VERIFY_REGISTRATION',
    key: 'errors.auth.passkey.verificationFailed',
  },
  // Better Auth general errors
  INVALID_EMAIL_OR_PASSWORD: {
    code: 'INVALID_EMAIL_OR_PASSWORD',
    key: 'errors.auth.invalidCredentials',
  },
  USER_NOT_FOUND: { code: 'USER_NOT_FOUND', key: 'errors.auth.userNotFound' },
  EMAIL_ALREADY_IN_USE: { code: 'EMAIL_ALREADY_IN_USE', key: 'errors.auth.emailInUse' },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', key: 'errors.auth.invalidToken' },
} as const;

/**
 * Error code type (string literal union of all error codes)
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]['code'];
