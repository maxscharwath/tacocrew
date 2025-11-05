/**
 * Backend API types - Types for communication with the distant backend API
 * These types represent the raw format we send/receive from the external backend
 * @module types/api
 */

/**
 * Stock information for a product (backend format)
 * This is the exact format returned by /office/stock_management.php?type=all
 * All items have name and in_stock, some categories (desserts, boissons, extras) also include price
 */
export interface StockInfo {
  name: string;
  in_stock: boolean;
  price?: number; // Present for desserts, boissons, and extras
}

/**
 * Stock availability for all product categories (backend format - dictionaries)
 * This is the raw format received from /office/stock_management.php?type=all
 * Contains stock status and product names directly from the backend
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
 * Resource item (product) from backend
 */
export interface Resource {
  id: string;
  name: string;
  category?: string;
  price?: number;
}

/**
 * All available resources (backend format with French keys)
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
 * Complete order data structure as returned from backend API
 * This is the raw format from the backend - uses plain strings for IDs
 */
export interface OrderData {
  status: string; // 'pending' | 'confirmed' | 'ondelivery' | 'delivered' | 'cancelled'
  type: string; // 'livraison' | 'emporter'
  date: string;
  price: number;
  requestedFor: string;
  tacos?: Array<{
    id: string;
    size: string;
    meats: Array<{ id: string; code: string; name: string; quantity: number }>;
    sauces: Array<{ id: string; code: string; name: string }>;
    garnitures: Array<{ id: string; code: string; name: string }>;
    note?: string;
    quantity: number;
    price: number;
  }>;
  extras?: Array<{
    id: string;
    code: string;
    name: string;
    price: number;
    quantity: number;
    free_sauce?: { id: string; name: string; price: number };
    free_sauces?: Array<{ id: string; name: string; price: number }>;
  }>;
  boissons?: Array<{
    id: string;
    code: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  desserts?: Array<{
    id: string;
    code: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

/**
 * CSRF token response from backend
 */
export interface CsrfTokenResponse {
  csrf_token: string;
}
