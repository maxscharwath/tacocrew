/**
 * Tests for ResourceService
 */

// Load test environment variables first
import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { BackendIntegrationClient } from '@/infrastructure/api/backend-integration.client';
import { ResourceService } from '@/services/resource/resource.service';
import { Currency, StockCategory } from '@/shared/types/types';

describe('ResourceService', () => {
  const mockBackendClient = {
    createNewSession: mock(),
    getStock: mock(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockBackendClient.createNewSession.mockReset();
    mockBackendClient.getStock.mockReset();

    container.registerInstance(
      BackendIntegrationClient,
      mockBackendClient as unknown as BackendIntegrationClient
    );
  });

  it('should transform backend stock to frontend format', async () => {
    const mockSessionContext = {
      csrfToken: 'test-token',
      cookies: { session: 'test-session' },
    };

    const mockBackendStock = {
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

    mockBackendClient.createNewSession.mockResolvedValue(mockSessionContext);
    mockBackendClient.getStock.mockResolvedValue(mockBackendStock);

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
    const mockSessionContext = {
      csrfToken: 'test-token',
      cookies: { session: 'test-session' },
    };

    const mockBackendStock = {
      viandes: {},
      sauces: {},
      garnitures: {},
      extras: {},
      boissons: {},
      desserts: {},
    };

    mockBackendClient.createNewSession.mockResolvedValue(mockSessionContext);
    mockBackendClient.getStock.mockResolvedValue(mockBackendStock);

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
    const mockSessionContext = {
      csrfToken: 'test-token',
      cookies: { session: 'test-session' },
    };

    const mockBackendStock = {
      viandes: {
        viande_hachee: { name: 'Viande Hachée', in_stock: true },
      },
      sauces: {},
      garnitures: {},
      extras: {},
      boissons: {},
      desserts: {},
    };

    mockBackendClient.createNewSession.mockResolvedValue(mockSessionContext);
    mockBackendClient.getStock.mockResolvedValue(mockBackendStock);

    const service = container.resolve(ResourceService);
    const result = await service.getStock();

    expect(result.meats[0]?.price).toBeUndefined();
  });
});
