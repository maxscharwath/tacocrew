/**
 * Resource service
 * @module services/resource
 */

import { TACO_SIZE_CONFIG, TacoSize } from '@tacocrew/gigatacos-client';
import { injectable } from 'tsyringe';
import { BackendIntegrationClient } from '@/infrastructure/api/backend-integration.client';
import { Currency, createAmount, StockCategory } from '@/shared/types/types';
import { inject } from '@/shared/utils/inject.utils';
import { deterministicUUID } from '@/shared/utils/uuid.utils';

/**
 * Resource service
 */
@injectable()
export class ResourceService {
  private readonly backendClient = inject(BackendIntegrationClient);

  async getStock() {
    // Create new session context for stock request (no existing session needed)
    const sessionContext = await this.backendClient.createNewSession();
    const { csrfToken, cookies } = sessionContext;

    // Fetch stock from backend
    const backendStock = await this.backendClient.getStock(csrfToken, cookies);

    // Transform dictionaries to arrays with deterministic IDs and convert prices to Amount objects
    return {
      meats: Object.entries(backendStock.viandes || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Meats),
        code,
        name: info.name,
        price: info.price !== undefined ? createAmount(info.price, Currency.CHF) : undefined,
        in_stock: info.in_stock,
      })),
      sauces: Object.entries(backendStock.sauces || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Sauces),
        code,
        name: info.name,
        price: info.price !== undefined ? createAmount(info.price, Currency.CHF) : undefined,
        in_stock: info.in_stock,
      })),
      garnishes: Object.entries(backendStock.garnitures || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Garnishes),
        code,
        name: info.name,
        price: info.price !== undefined ? createAmount(info.price, Currency.CHF) : undefined,
        in_stock: info.in_stock,
      })),
      extras: Object.entries(backendStock.extras || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Extras),
        code,
        name: info.name,
        price: info.price !== undefined ? createAmount(info.price, Currency.CHF) : undefined,
        in_stock: info.in_stock,
      })),
      drinks: Object.entries(backendStock.boissons || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Drinks),
        code,
        name: info.name,
        price: info.price !== undefined ? createAmount(info.price, Currency.CHF) : undefined,
        in_stock: info.in_stock,
      })),
      desserts: Object.entries(backendStock.desserts || {}).map(([code, info]) => ({
        id: deterministicUUID(code, StockCategory.Desserts),
        code,
        name: info.name,
        price: info.price !== undefined ? createAmount(info.price, Currency.CHF) : undefined,
        in_stock: info.in_stock,
      })),
      tacos: Object.entries(TACO_SIZE_CONFIG).map(([code, config]) => ({
        id: deterministicUUID(code, 'tacos'),
        code: code as TacoSize,
        name: config.name,
        price: createAmount(config.price, Currency.CHF),
        maxMeats: config.maxMeats,
        maxSauces: config.maxSauces,
        allowGarnitures: config.allowGarnitures,
      })),
    };
  }
}
