/**
 * Resource service for managing products and stock
 * @module services/resource
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { TacosApiClient } from '../api/client';
import { StockAvailability } from '../types';
import { inject } from '../utils/inject';
import { logger } from '../utils/logger';

/**
 * Resource Service
 * Stock information is global, not session-specific
 */
@injectable()
export class ResourceService {
  private readonly apiClient = inject(TacosApiClient);

  /**
   * Get stock availability for all products
   */
  async getStock(): Promise<StockAvailability> {
    logger.debug('Fetching stock from backend');

    // Fetch a fresh CSRF token for this request
    const { csrfToken } = await this.apiClient.refreshCsrfToken();

    const response = await this.apiClient.get<StockAvailability>(
      '/office/stock_management.php?type=all',
      {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    );

    logger.info('Stock data fetched', {
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

}
