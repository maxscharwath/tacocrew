/**
 * Types for backend client
 * @module gigatacos-client/types
 */

export type { OrderSummary } from './parsers';

/**
 * Stock information for a product (backend format)
 */
export interface StockInfo {
  name: string;
  in_stock: boolean;
  price?: number;
}

/**
 * Stock availability for all product categories (backend format - dictionaries)
 */
export interface StockAvailabilityBackend {
  viandes: Record<string, StockInfo>;
  sauces: Record<string, StockInfo>;
  garnitures: Record<string, StockInfo>;
  desserts: Record<string, StockInfo>;
  boissons: Record<string, StockInfo>;
  extras: Record<string, StockInfo>;
}

/**
 * Taco size options
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
 * Taco size configuration with metadata
 * Shared between API and frontend
 */
export interface TacoSizeConfig {
  name: string;
  price: number;
  maxMeats: number;
  maxSauces: number;
  allowGarnitures: boolean;
}

/**
 * Complete taco size configurations - single source of truth
 * Contains all metadata for each taco size including pricing and constraints
 */
export const TACO_SIZE_CONFIG: Record<TacoSize, TacoSizeConfig> = {
  [TacoSize.L]: {
    name: 'Tacos L',
    price: 11,
    maxMeats: 1,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.BOWL]: {
    name: 'Tacos Bowl',
    price: 14,
    maxMeats: 2,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.L_MIXTE]: {
    name: 'Tacos L Mixte',
    price: 12,
    maxMeats: 3,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.XL]: {
    name: 'Tacos XL',
    price: 18.5,
    maxMeats: 3,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.XXL]: {
    name: 'Tacos XXL',
    price: 28,
    maxMeats: 4,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.GIGA]: {
    name: 'Tacos GIGA',
    price: 38,
    maxMeats: 5,
    maxSauces: 3,
    allowGarnitures: true,
  },
};

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
 * Stock category
 */
export enum StockCategory {
  AVAILABLE = 'available',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

/**
 * Stock availability information
 */
export interface StockAvailability {
  meats?: Record<string, StockCategory>;
  sauces?: Record<string, StockCategory>;
  garnitures?: Record<string, StockCategory>;
  extras?: Record<string, StockCategory>;
  drinks?: Record<string, StockCategory>;
  desserts?: Record<string, StockCategory>;
}

/**
 * Meat in a taco
 */
export interface Meat {
  id: string;
  name: string;
  quantity: number;
}

/**
 * Sauce in a taco
 */
export interface Sauce {
  id: string;
  name: string;
}

/**
 * Garniture in a taco
 */
export interface Garniture {
  id: string;
  name: string;
}

/**
 * Taco interface
 */
export interface Taco {
  id: string;
  size: TacoSize;
  meats: Meat[];
  sauces: Sauce[];
  garnitures: Garniture[];
  note?: string;
  price?: number;
}

/**
 * Logger interface (optional dependency)
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Session context - contains session ID, CSRF token, and cookies
 */
export interface SessionContext {
  sessionId: string;
  csrfToken: string;
  cookies: Record<string, string>;
}

/**
 * Proxy configuration for header-based proxy routing (e.g., PHP proxy)
 */
export interface ProxyConfig {
  url: string; // Proxy server URL (e.g., "https://proxy.studimax.ch")
  apiKey?: string; // API key for proxy authentication (sent as X-API-Key header)
}

export interface HttpClientConfig {
  baseUrl: string;
  logger?: Logger;
  proxy?: ProxyConfig; // Proxy configuration object
}

/**
 * Configuration for GigatacosClient
 */
export interface GigatacosClientConfig {
  baseUrl: string;
  logger?: Logger;
  proxy?: ProxyConfig; // Proxy configuration object
}

/**
 * Payment method options
 */
export type PaymentMethod = 'especes' | 'carte' | 'twint';

/**
 * Order submission data for RocknRoll.php endpoint
 */
export interface OrderSubmissionData {
  name: string;
  phone: string;
  confirmPhone: string;
  address: string;
  type: string;
  requestedFor: string;
  transaction_id: string;
  payment_method?: PaymentMethod;
  [key: string]: unknown; // Allow additional properties for flexibility
}

/**
 * Ingredient in RocknRoll response (meat/viande)
 */
export interface RocknRollIngredient {
  slug: string;
  name: string;
  quantity: number;
}

/**
 * Simple ingredient in RocknRoll response (sauce/garniture)
 */
export interface RocknRollSimpleIngredient {
  slug: string;
  name: string;
}

/**
 * Taco in RocknRoll response
 */
export interface RocknRollTaco {
  slug: string;
  taille: string;
  name: string;
  price: number;
  viande: RocknRollIngredient[];
  garniture: RocknRollSimpleIngredient[];
  sauce: RocknRollSimpleIngredient[];
  tacosNote: string;
  quantity: number;
}

/**
 * Delivery data in RocknRoll response
 */
export interface RocknRollDeliveryData {
  minOrderAmount: number;
  postalcode: string;
  ville: string;
}

/**
 * Order data structure from RocknRoll.php response
 */
export interface OrderData {
  price: string;
  time: string;
  totalPrice: number;
  name: string;
  phone: string;
  address: string;
  status: OrderStatus;
  date: string;
  type: OrderType;
  requestedFor: string;
}

/**
 * Order submission response from RocknRoll.php
 */
export interface OrderSubmissionResponse {
  success: boolean;
  orderId: string;
  tacos: RocknRollTaco[];
  extras: unknown[];
  boissons: unknown[];
  desserts: unknown[];
  DeliveryData: RocknRollDeliveryData;
  OrderData: OrderData;
}

/**
 * Response from adding items to cart (extras, drinks, desserts)
 */
export interface CartItemResponse {
  status?: string;
  message?: string;
  [key: string]: unknown; // Allow additional fields from backend
}

/**
 * Form data for adding a taco to cart
 */
export interface TacoFormData {
  taille: string;
  tacosNote?: string;
  'viande[]': string[];
  'sauce[]': string[];
  'garniture[]': string[];
  [key: `meat_quantity[${string}]`]: number;
  [key: string]: string | string[] | number | undefined; // Allow additional properties
}

/**
 * Form data for adding an extra to cart
 * Backend expects JSON: { id, name, price, quantity, free_sauce?, free_sauces? }
 */
export interface ExtraFormData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  free_sauce?: { id: string; name: string; price: number };
  free_sauces?: string[];
  [key: string]: unknown; // Allow additional properties
}

/**
 * Form data for adding a drink to cart
 * Backend expects JSON: { id, name, price, quantity }
 */
export interface DrinkFormData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Form data for adding a dessert to cart
 * Note: usd.php endpoint returns 404 - may not exist. Verify with backend.
 * Backend expects JSON: { id, name, price, quantity } (if endpoint exists)
 */
export interface DessertFormData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  [key: string]: unknown; // Allow additional properties
}
