/**
 * Core type definitions for the Tacos Ordering API
 * @module types
 */

// Re-export session types
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

/**
 * Meat ingredient with quantity
 */
export interface Meat {
  id: string;
  name: string;
  quantity: number;
}

/**
 * Sauce ingredient
 */
export interface Sauce {
  id: string;
  name: string;
}

/**
 * Garniture (topping) ingredient
 */
export interface Garniture {
  id: string;
  name: string;
}

/**
 * Complete taco configuration
 */
export interface Taco {
  /** Unique taco UUID */
  id: string;
  size: TacoSize;
  meats: Meat[];
  sauces: Sauce[];
  garnitures: Garniture[];
  note?: string;
  quantity: number;
  price: number;
}

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

/**
 * Extra item (fries, nuggets, etc.)
 */
export interface Extra {
  id: string;
  name: string;
  price: number;
  quantity: number;
  free_sauce?: FreeSauce;
  free_sauces?: FreeSauce[];
}

/**
 * Free sauce for extras
 */
export interface FreeSauce {
  id: string;
  name: string;
  price: number;
}

/**
 * Drink item
 */
export interface Drink {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Dessert item
 */
export interface Dessert {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

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
  cartId: string;
  /** Session data (CSRF token, cookies, etc.) */
  session: CartMetadata;
  tacos: Taco[];
  extras: Extra[];
  drinks: Drink[];
  desserts: Dessert[];
  summary: CartSummary;
}

/**
 * Stock information for a product
 */
export interface StockInfo {
  in_stock: boolean;
}

/**
 * Stock availability for all product categories
 */
export interface StockAvailability {
  viandes: Record<string, StockInfo>;
  sauces: Record<string, StockInfo>;
  garnitures: Record<string, StockInfo>;
  desserts: Record<string, StockInfo>;
  boissons: Record<string, StockInfo>;
  extras: Record<string, StockInfo>;
}

/**
 * Resource item (product)
 */
export interface Resource {
  id: string;
  name: string;
  category?: string;
  price?: number;
}

/**
 * All available resources
 */
export interface Resources {
  viandes: Resource[];
  sauces: Resource[];
  garnitures: Resource[];
  desserts: Resource[];
  boissons: Resource[];
  extras: Resource[];
}

/**
 * Customer information
 */
export interface Customer {
  name: string;
  phone: string;
}

/**
 * Delivery information
 */
export interface DeliveryInfo {
  type: OrderType;
  address?: string;
  requestedFor: string; // Time slot (e.g., "15:00")
}

/**
 * Order creation request
 */
export interface CreateOrderRequest {
  customer: Customer;
  delivery: DeliveryInfo;
}

/**
 * Complete order data
 */
export interface OrderData {
  status: OrderStatus;
  type: OrderType;
  date: string;
  price: number;
  requestedFor: string;
  tacos?: Taco[];
  extras?: Extra[];
  boissons?: Drink[];
  desserts?: Dessert[];
}

/**
 * Order with ID
 */
export interface Order {
  orderId: string;
  OrderData: OrderData;
}

/**
 * Time slot with demand information
 */
export interface TimeSlot {
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

/**
 * CSRF token response
 */
export interface CsrfTokenResponse {
  csrf_token: string;
}

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
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
  [TacoSize.BOWL]: { maxMeats: 2, maxSauces: 3, allowGarnitures: false },
  [TacoSize.L_MIXTE]: { maxMeats: 3, maxSauces: 3, allowGarnitures: true },
  [TacoSize.XL]: { maxMeats: 3, maxSauces: 3, allowGarnitures: true },
  [TacoSize.XXL]: { maxMeats: 4, maxSauces: 3, allowGarnitures: true },
  [TacoSize.GIGA]: { maxMeats: 5, maxSauces: 3, allowGarnitures: true },
};

/**
 * Error codes
 */
export enum ErrorCode {
  CSRF_INVALID = 'CSRF_INVALID',
  RATE_LIMIT = 'RATE_LIMIT',
  DUPLICATE_ORDER = 'DUPLICATE_ORDER',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
