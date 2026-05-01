/**
 * Resource service
 * @module services/resource
 */

import { injectable } from 'tsyringe';
import type { Promo } from '@/domain/promos';
import type { StockAvailability as RawStockAvailability } from '@/domain/taco-config';
import { TACO_SIZE_CONFIG, TacoSize } from '@/domain/taco-config';
import { CommandeIntegrationClient } from '@/infrastructure/api/commande-integration.client';
import { config } from '@/shared/config/app.config';
import {
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
    const [{ stock, tacoImages }, promos] = await Promise.all([
      this.commande.getMenuSnapshot(config.commande.restaurantId),
      this.commande.getPromos(config.commande.restaurantId).catch(() => []),
    ]);
    return this.transformStock(stock, tacoImages, promos);
  }

  private transformStock(
    raw: RawStockAvailability,
    tacoImages: Readonly<Record<string, string | null>>,
    promos: ReadonlyArray<Promo>
  ): StockAvailability {
    return {
      [StockCategory.Meats]: this.mapBucket(raw.viandes, StockCategory.Meats),
      [StockCategory.Sauces]: this.mapBucket(raw.sauces, StockCategory.Sauces),
      [StockCategory.Garnishes]: this.mapBucket(raw.garnitures, StockCategory.Garnishes),
      [StockCategory.Extras]: this.mapBucket(raw.extras, StockCategory.Extras),
      [StockCategory.Drinks]: this.mapBucket(raw.boissons, StockCategory.Drinks),
      [StockCategory.Desserts]: this.mapBucket(raw.desserts, StockCategory.Desserts),
      tacos: this.buildTacoSizes(tacoImages),
      promos: promos.map((p) => ({
        kind: p.kind,
        id: p.id,
        name: p.name,
        serviceTypes: [...p.serviceTypes],
        trigger: {
          quantity: p.trigger.quantity,
          ...(p.trigger.tacoSizes !== undefined && { tacoSizes: [...p.trigger.tacoSizes] }),
        },
        reward: {
          quantity: p.reward.quantity,
          category: p.reward.category,
          excludedCodes: [...p.reward.excludedCodes],
        },
      })),
    };
  }

  private mapBucket(
    bucket: Record<string, RawStockAvailability['viandes'][string]>,
    category: StockCategory
  ): StockItem[] {
    return Object.entries(bucket).map(([code, info]) => ({
      id: deterministicUUID(code, category),
      code,
      name: info.name,
      price: info.price === undefined ? undefined : createAmount(info.price, Currency.CHF),
      in_stock: info.in_stock,
      ...(info.imageUrl !== undefined && { imageUrl: info.imageUrl }),
    }));
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
