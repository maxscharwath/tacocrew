/**
 * Resource service for managing products and stock
 * @module services/resource
 */

import { injectable } from 'tsyringe';
import { TacosApiClient } from '@/api/client';
import { StockAvailability, StockAvailabilityBackend, StockCategory, StockItem } from '@/types';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';
import { deterministicUUID } from '@/utils/uuid-utils';

/**
 * Resource Service
 * Stock information is global, not session-specific
 */
@injectable()
export class ResourceService {
  private readonly apiClient = inject(TacosApiClient);

  /**
   * Get stock availability for all products
   * The backend endpoint returns stock status along with product names
   */
  async getStock(): Promise<StockAvailability> {
    logger.debug('Fetching stock from backend');

    // Fetch a fresh CSRF token for this request
    const { csrfToken } = await this.apiClient.refreshCsrfToken();

    // Fetch stock data from external API (contains in_stock status and product names)
    const stockResponse = await this.apiClient.get<StockAvailabilityBackend>(
      '/office/stock_management.php?type=all',
      {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    );

    // Log the full response to inspect backend format
    logger.debug('Stock response from backend', {
      response: JSON.stringify(stockResponse, null, 2),
    });

    // Convert dictionaries to arrays with deterministic UUIDs (map from French backend to English API)
    // Names come directly from the backend API response
    const transformed: StockAvailability = {
      [StockCategory.Meats]: Object.entries(stockResponse.viandes ?? {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Meats),
        code,
        name: info.name,
        in_stock: info.in_stock,
      })),
      [StockCategory.Sauces]: Object.entries(stockResponse.sauces ?? {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Sauces),
        code,
        name: info.name,
        in_stock: info.in_stock,
      })),
      [StockCategory.Garnishes]: Object.entries(stockResponse.garnitures ?? {}).map(
        ([code, info]) => ({
          id: deterministicUUID(code, StockCategory.Garnishes),
          code,
          name: info.name,
          in_stock: info.in_stock,
        })
      ),
      [StockCategory.Desserts]: Object.entries(stockResponse.desserts ?? {}).map(
        ([code, info]) => ({
          id: deterministicUUID(code, StockCategory.Desserts),
          code,
          name: info.name,
          in_stock: info.in_stock,
        })
      ),
      [StockCategory.Drinks]: Object.entries(stockResponse.boissons ?? {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Drinks),
        code,
        name: info.name,
        in_stock: info.in_stock,
      })),
      [StockCategory.Extras]: Object.entries(stockResponse.extras ?? {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Extras),
        code,
        name: info.name,
        in_stock: info.in_stock,
      })),
    };

    return transformed;
  }

  /**
   * Check if a product is in stock
   */
  async isInStock(category: StockCategory, productCode: StockItem['code']): Promise<boolean> {
    const stock = await this.getStock();
    const product = stock[category]?.find((item) => item.code === productCode);
    return product?.in_stock ?? false;
  }

  /**
   * Get out of stock products for a category
   */
  async getOutOfStockProducts(category: StockCategory): Promise<Array<StockItem['code']>> {
    const stock = await this.getStock();
    const categoryStock = stock[category] ?? [];

    return categoryStock.filter((item) => !item.in_stock).map((item) => item.code);
  }
}
