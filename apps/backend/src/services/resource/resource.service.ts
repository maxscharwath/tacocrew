/**
 * Resource service
 * @module services/resource
 */

import { injectable } from 'tsyringe';
import { TacosApiClient } from '@/infrastructure/api/tacos-api.client';
import type { StockAvailabilityBackend } from '@/shared/types/api';
import type { StockAvailability } from '@/shared/types/types';
import { StockCategory, TACO_SIZE_CONFIG, TacoSize } from '@/shared/types/types';
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
      tacos: [
        {
          id: deterministicUUID(TacoSize.L, 'tacos'),
          code: TacoSize.L,
          name: 'Tacos L',
          price: 11.0,
          ...TACO_SIZE_CONFIG[TacoSize.L],
        },
        {
          id: deterministicUUID(TacoSize.L_MIXTE, 'tacos'),
          code: TacoSize.L_MIXTE,
          name: 'Tacos L Mixte',
          price: 12.0,
          ...TACO_SIZE_CONFIG[TacoSize.L_MIXTE],
        },
        {
          id: deterministicUUID(TacoSize.XL, 'tacos'),
          code: TacoSize.XL,
          name: 'Tacos XL',
          price: 18.5,
          ...TACO_SIZE_CONFIG[TacoSize.XL],
        },
        {
          id: deterministicUUID(TacoSize.XXL, 'tacos'),
          code: TacoSize.XXL,
          name: 'Tacos XXL',
          price: 28.0,
          ...TACO_SIZE_CONFIG[TacoSize.XXL],
        },
        {
          id: deterministicUUID(TacoSize.GIGA, 'tacos'),
          code: TacoSize.GIGA,
          name: 'Tacos GIGA',
          price: 38.0,
          ...TACO_SIZE_CONFIG[TacoSize.GIGA],
        },
        {
          id: deterministicUUID(TacoSize.BOWL, 'tacos'),
          code: TacoSize.BOWL,
          name: 'Tacos Bowl',
          price: 14.0,
          ...TACO_SIZE_CONFIG[TacoSize.BOWL],
        },
      ],
    };
  }
}
