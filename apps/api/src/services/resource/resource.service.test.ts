/**
 * Tests for ResourceService
 */

import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import type { StockAvailability as RawStockAvailability } from '@/domain/taco-config';
import { CommandeIntegrationClient } from '@/infrastructure/api/commande-integration.client';
import { ResourceService } from '@/services/resource/resource.service';
import { Currency } from '@/shared/types/types';

describe('ResourceService', () => {
  const mockCommandeClient = {
    getMenuSnapshot:
      mock<
        (restaurantId: string) => Promise<{
          stock: RawStockAvailability;
          tacoImages: Readonly<Record<string, string | null>>;
          croustyProducts: never[];
        }>
      >(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockCommandeClient.getMenuSnapshot.mockReset();

    container.registerInstance(
      CommandeIntegrationClient,
      mockCommandeClient as unknown as CommandeIntegrationClient
    );
  });

  it('should transform backend stock to frontend format', async () => {
    const mockStock: RawStockAvailability = {
      viandes: {
        viande_hachee: { name: 'Viande Hachée', price: 5, in_stock: true },
      },
      sauces: {
        harissa: { name: 'Harissa', price: 0, in_stock: true },
      },
      garnitures: {
        salade: { name: 'Salade', price: 0, in_stock: true },
      },
      extras: {
        extra_frites: { name: 'Frites', price: 3, in_stock: true },
      },
      boissons: {},
      desserts: {},
    };

    mockCommandeClient.getMenuSnapshot.mockResolvedValue({
      stock: mockStock,
      tacoImages: {},
      croustyProducts: [],
    });

    const service = container.resolve(ResourceService);
    const result = await service.getStock();

    expect(result.meats).toHaveLength(1);
    expect(result.meats[0]?.code).toBe('viande_hachee');
    expect(result.meats[0]?.name).toBe('Viande Hachée');
    expect(result.meats[0]?.price?.value).toBe(5);
    expect(result.meats[0]?.price?.currency).toBe(Currency.CHF);
    expect(result.meats[0]?.in_stock).toBe(true);

    expect(result.sauces).toHaveLength(1);
    expect(result.sauces[0]?.code).toBe('harissa');

    expect(result.garnishes).toHaveLength(1);
    expect(result.garnishes[0]?.code).toBe('salade');

    expect(result.extras).toHaveLength(1);
    expect(result.extras[0]?.code).toBe('extra_frites');

    expect(result.drinks).toHaveLength(0);
    expect(result.desserts).toHaveLength(0);
    expect(result.tacos.length).toBeGreaterThan(0);
  });

  it('should handle empty stock', async () => {
    const mockStock: RawStockAvailability = {
      viandes: {},
      sauces: {},
      garnitures: {},
      extras: {},
      boissons: {},
      desserts: {},
    };

    mockCommandeClient.getMenuSnapshot.mockResolvedValue({
      stock: mockStock,
      tacoImages: {},
      croustyProducts: [],
    });

    const service = container.resolve(ResourceService);
    const result = await service.getStock();

    expect(result.meats).toHaveLength(0);
    expect(result.sauces).toHaveLength(0);
    expect(result.garnishes).toHaveLength(0);
    expect(result.extras).toHaveLength(0);
    expect(result.drinks).toHaveLength(0);
    expect(result.desserts).toHaveLength(0);
    expect(result.tacos.length).toBeGreaterThan(0);
  });

  it('should handle items without price', async () => {
    const mockStock: RawStockAvailability = {
      viandes: {
        viande_hachee: { name: 'Viande Hachée', in_stock: true },
      },
      sauces: {},
      garnitures: {},
      extras: {},
      boissons: {},
      desserts: {},
    };

    mockCommandeClient.getMenuSnapshot.mockResolvedValue({
      stock: mockStock,
      tacoImages: {},
      croustyProducts: [],
    });

    const service = container.resolve(ResourceService);
    const result = await service.getStock();

    expect(result.meats[0]?.price).toBeUndefined();
  });
});
