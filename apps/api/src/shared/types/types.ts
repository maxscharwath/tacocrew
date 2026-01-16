/**
 * Core type definitions for the Tacos Ordering API
 * @module types
 */

import { OrderType, TacoSize } from '@tacocrew/gigatacos-client';
import { CartId } from '@/schemas/cart.schema';
import { Dessert } from '@/schemas/dessert.schema';
import { Drink } from '@/schemas/drink.schema';
import { Extra } from '@/schemas/extra.schema';
import { GroupOrderId } from '@/schemas/group-order.schema';
import type { Taco } from '@/schemas/taco.schema';
import { UserId } from '@/schemas/user.schema';
import { UserOrderId } from '@/schemas/user-order.schema';
import { TimeSlot } from '@/shared/types/time-slot';

export * from '@/shared/types/api';
export * from '@/shared/types/session';

// Meat, Sauce, Garniture, and Taco types are now exported from @/schemas/taco.schema

/**
 * Currency namespace with common ISO 4217 currency codes
 * Use Currency.CHF, Currency.EUR, etc. for type-safe currency access
 */
export const Currency = {
  CHF: 'CHF', // Swiss Franc
  EUR: 'EUR', // Euro
  USD: 'USD', // US Dollar
  GBP: 'GBP', // British Pound
  JPY: 'JPY', // Japanese Yen
  CAD: 'CAD', // Canadian Dollar
  AUD: 'AUD', // Australian Dollar
  CNY: 'CNY', // Chinese Yuan
} as const;

/**
 * Common currency codes from the Currency namespace
 */
export type CommonCurrency = (typeof Currency)[keyof typeof Currency];

/**
 * Currency type that allows common currencies with autocomplete
 * while also accepting any valid ISO 4217 currency code string
 */
export type CurrencyCode = CommonCurrency | string;

/**
 * Represents a monetary amount with currency
 */
export type Amount = Readonly<{
  /** The monetary value */
  value: number;
  /** The currency code (ISO 4217) */
  currency: CurrencyCode;
}>;

/**
 * Creates an Amount object
 */
export function createAmount(value: number, currency: CurrencyCode = Currency.CHF): Amount {
  return { value, currency };
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
  price?: Amount;
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
  price: Amount;
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
 * Group order status
 */
export enum GroupOrderStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SUBMITTED = 'submitted',
  EXPIRED = 'expired',
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
 * Re-export error codes from shared package
 */
export { type ErrorCode, ErrorCodes } from '@tacocrew/errors';
