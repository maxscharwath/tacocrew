/**
 * Resource service
 * @module services/resource
 */

import { injectable } from 'tsyringe';
import type { CroustyProduct } from '@/domain/crousty-config';
import type { StockAvailability as RawStockAvailability } from '@/domain/taco-config';
import { TACO_SIZE_CONFIG, TacoSize } from '@/domain/taco-config';
import { CommandeIntegrationClient } from '@/infrastructure/api/commande-integration.client';
import { config } from '@/shared/config/app.config';
import {
  type CroustyProductDto,
  Currency,
  createAmount,
  type StockAvailability,
  StockCategory,
  type StockItem,
  type TacoSizeItem,
} from '@/shared/types/types';
import { inject } from '@/shared/utils/inject.utils';
import { deterministicUUID } from '@/shared/utils/uuid.utils';

/**
 * Resource service — reads the commande.app menu and projects it into the
 * API-facing `StockAvailability` shape consumed by the rest of apps/api.
 */
@injectable()
export class ResourceService {
  private readonly commande = inject(CommandeIntegrationClient);

  getStockForProcessing(): Promise<StockAvailability> {
    return this.getStock();
  }

  async getStock(): Promise<StockAvailability> {
    const { stock, tacoImages, croustyProducts } = await this.commande.getMenuSnapshot(
      config.commande.restaurantId
    );
    return this.transformStock(stock, tacoImages, croustyProducts);
  }

  private transformStock(
    raw: RawStockAvailability,
    tacoImages: Readonly<Record<string, string | null>>,
    croustyProducts: ReadonlyArray<CroustyProduct>
  ): StockAvailability {
    return {
      [StockCategory.Meats]: this.mapBucket(raw.viandes, StockCategory.Meats),
      [StockCategory.Sauces]: this.mapBucket(raw.sauces, StockCategory.Sauces),
      [StockCategory.Garnishes]: this.mapBucket(raw.garnitures, StockCategory.Garnishes),
      [StockCategory.Extras]: this.mapBucket(raw.extras, StockCategory.Extras),
      [StockCategory.Drinks]: this.mapBucket(raw.boissons, StockCategory.Drinks),
      [StockCategory.Desserts]: this.mapBucket(raw.desserts, StockCategory.Desserts),
      tacos: this.buildTacoSizes(tacoImages),
      crousties: croustyProducts.map((c) => this.mapCrousty(c)),
    };
  }

  private mapBucket(
    bucket: Record<string, RawStockAvailability['viandes'][string]> | undefined,
    category: StockCategory
  ): StockItem[] {
    return Object.entries(bucket ?? {}).map(([code, info]) => ({
      id: deterministicUUID(code, category),
      code,
      name: info.name,
      price: info.price === undefined ? undefined : createAmount(info.price, Currency.CHF),
      in_stock: info.in_stock,
      ...(info.imageUrl !== undefined && { imageUrl: info.imageUrl }),
      ...(info.availableSizes !== undefined && { availableSizes: [...info.availableSizes] }),
    }));
  }

  private mapCrousty(product: CroustyProduct): CroustyProductDto {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      price: createAmount(product.price, Currency.CHF),
      in_stock: product.available,
      variant: product.variant,
      ...(product.imageUrl !== null && { imageUrl: product.imageUrl }),
      optionGroups: product.optionGroups.map((group) => ({
        id: group.id,
        name: group.name,
        minSelection: group.minSelection,
        maxSelection: group.maxSelection,
        options: group.options.map((option) => ({
          id: option.id,
          name: option.name,
          in_stock: option.available,
          ...(option.price > 0 && { price: createAmount(option.price, Currency.CHF) }),
        })),
      })),
    };
  }

  private buildTacoSizes(tacoImages: Readonly<Record<string, string | null>>): TacoSizeItem[] {
    return Object.values(TacoSize).map((code) => {
      const meta = TACO_SIZE_CONFIG[code];
      const imageUrl = tacoImages[code] ?? null;
      return {
        id: deterministicUUID(code, 'tacos'),
        code,
        name: meta.name,
        price: createAmount(meta.price, Currency.CHF),
        maxMeats: meta.maxMeats,
        maxSauces: meta.maxSauces,
        allowGarnitures: meta.allowGarnitures,
        ...(imageUrl !== null && { imageUrl }),
      };
    });
  }
}
