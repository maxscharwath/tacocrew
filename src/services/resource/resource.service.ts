/**
 * Resource service
 * @module services/resource
 */

import { injectable } from 'tsyringe';
import { TacosApiClient } from '@/infrastructure/api/tacos-api.client';
import type { StockAvailabilityBackend } from '@/shared/types/api';
import type { StockAvailability } from '@/shared/types/types';
import { StockCategory } from '@/shared/types/types';
import { inject } from '@/shared/utils/inject.utils';
import { deterministicUUID } from '@/shared/utils/uuid.utils';

/**
 * Resource service
 */
@injectable()
export class ResourceService {
  private readonly apiClient = inject(TacosApiClient);

  async getStock(): Promise<StockAvailability> {
    // Refresh CSRF token first and get the token
    const { csrfToken } = await this.apiClient.refreshCsrfToken();

    // Fetch stock from backend
    const backendStock = await this.apiClient.get<StockAvailabilityBackend>(
      '/office/stock_management.php?type=all',
      {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    );

    // Transform dictionaries to arrays with deterministic IDs
    return {
      meats: Object.entries(backendStock.viandes || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Meats),
        code,
        name: info.name,
        price: info.price ?? 0,
        in_stock: info.in_stock,
      })),
      sauces: Object.entries(backendStock.sauces || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Sauces),
        code,
        name: info.name,
        price: info.price ?? 0,
        in_stock: info.in_stock,
      })),
      garnishes: Object.entries(backendStock.garnitures || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Garnishes),
        code,
        name: info.name,
        price: info.price ?? 0,
        in_stock: info.in_stock,
      })),
      extras: Object.entries(backendStock.extras || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Extras),
        code,
        name: info.name,
        price: info.price ?? 0,
        in_stock: info.in_stock,
      })),
      drinks: Object.entries(backendStock.boissons || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Drinks),
        code,
        name: info.name,
        price: info.price ?? 0,
        in_stock: info.in_stock,
      })),
      desserts: Object.entries(backendStock.desserts || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Desserts),
        code,
        name: info.name,
        price: info.price ?? 0,
        in_stock: info.in_stock,
      })),
    };
  }
}
