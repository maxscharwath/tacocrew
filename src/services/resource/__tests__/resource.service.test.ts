/**
 * Unit tests for ResourceService
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockTacosApiClient } from '@/shared/utils/__tests__/mocks';
import { TacosApiClient } from '@/infrastructure/api/tacos-api.client';
import { ResourceService } from '@/services/resource/resource.service';
import { StockAvailabilityBackend, StockCategory } from '@/shared/types/types';

describe('ResourceService', () => {
  let resourceService: ResourceService;
  let mockApiClient: ReturnType<typeof createMockTacosApiClient>;

  beforeEach(() => {
    container.clearInstances();

    mockApiClient = createMockTacosApiClient();
    container.registerInstance(TacosApiClient, mockApiClient as unknown as TacosApiClient);

    resourceService = container.resolve(ResourceService);
  });

  describe('getStock', () => {
    it('should fetch stock from backend and transform to arrays', async () => {
      const mockBackendStock: StockAvailabilityBackend = {
        viandes: {
          viande_hachee: { name: 'Viande Hachée', in_stock: true },
          poulet: { name: 'Poulet', in_stock: true },
        },
        sauces: {
          harissa: { name: 'Harissa', in_stock: true },
        },
        garnitures: {},
        desserts: {},
        boissons: {},
        extras: {},
      };
      const mockCsrfToken = 'test-csrf-token';

      mockApiClient.refreshCsrfToken.mockResolvedValue({ csrfToken: mockCsrfToken, cookies: {} });
      mockApiClient.get.mockResolvedValue(mockBackendStock);

      const result = await resourceService.getStock();

      expect(result.meats).toHaveLength(2);
      expect(result.meats[0]).toHaveProperty('id');
      expect(result.meats[0]).toHaveProperty('code', 'viande_hachee');
      expect(result.meats[0]).toHaveProperty('in_stock', true);
      expect(mockApiClient.refreshCsrfToken).toHaveBeenCalled();
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/office/stock_management.php?type=all',
        expect.objectContaining({
          headers: { 'X-CSRF-Token': mockCsrfToken },
        })
      );
    });

    it('should fetch stock on every call', async () => {
      const mockBackendStock: StockAvailabilityBackend = {
        viandes: {},
        sauces: {},
        garnitures: {},
        desserts: {},
        boissons: {},
        extras: {},
      };
      const mockCsrfToken = 'test-csrf-token';

      mockApiClient.refreshCsrfToken.mockResolvedValue({ csrfToken: mockCsrfToken, cookies: {} });
      mockApiClient.get.mockResolvedValue(mockBackendStock);

      // First call
      await resourceService.getStock();
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);

      // Second call - should fetch again (no cache)
      await resourceService.getStock();
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

});
