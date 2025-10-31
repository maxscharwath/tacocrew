/**
 * Resource service for managing products and stock
 * @module services/resource
 */

import { apiClient } from '../api/client';
import { logger } from '../utils/logger';
import { StockAvailability } from '../types';

/**
 * Resource Service
 * Stock information is global, not session-specific
 */
export class ResourceService {
  private stockCache: StockAvailability | null = null;
  private stockCacheTimestamp = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Initialize the resource service
   */
  async initialize(): Promise<void> {
    if (!apiClient['csrfToken']) {
      await apiClient.initialize();
    }
  }

  /**
   * Get stock availability for all products
   */
  async getStock(forceRefresh = false): Promise<StockAvailability> {
    const now = Date.now();

    // Return cached stock if valid
    if (!forceRefresh && this.stockCache && now - this.stockCacheTimestamp < this.CACHE_TTL) {
      logger.debug('Returning cached stock data');
      return this.stockCache;
    }

    logger.debug('Fetching stock from backend');

    // Ensure we have a CSRF token
    await this.initialize();

    const response = await apiClient.get<StockAvailability>(
      '/office/stock_management.php?type=all'
    );

    this.stockCache = response;
    this.stockCacheTimestamp = now;

    logger.info('Stock data fetched and cached', {
      categories: Object.keys(response).length,
    });

    return response;
  }

  /**
   * Check if a product is in stock
   */
  async isInStock(category: keyof StockAvailability, productId: string): Promise<boolean> {
    const stock = await this.getStock();
    const product = stock[category]?.[productId];
    return product?.in_stock ?? false;
  }

  /**
   * Get out of stock products for a category
   */
  async getOutOfStockProducts(category: keyof StockAvailability): Promise<string[]> {
    const stock = await this.getStock();
    const categoryStock = stock[category] || {};

    return Object.entries(categoryStock)
      .filter(([_, info]) => !info.in_stock)
      .map(([id]) => id);
  }

  /**
   * Clear stock cache
   */
  clearCache(): void {
    this.stockCache = null;
    this.stockCacheTimestamp = 0;
    logger.debug('Stock cache cleared');
  }
}

export const resourceService = new ResourceService();
export default resourceService;
