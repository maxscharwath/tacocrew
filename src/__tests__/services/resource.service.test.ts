/**
 * Unit tests for ResourceService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ResourceService } from '../../services/resource.service';
import { TacosApiClient } from '../../api/client';
import { createMockTacosApiClient, createMockStockAvailability } from '../mocks';

describe('ResourceService', () => {
  let resourceService: ResourceService;
  let mockApiClient: ReturnType<typeof createMockTacosApiClient>;

  beforeEach(() => {
    container.clearInstances();

    mockApiClient = createMockTacosApiClient();
    container.registerInstance(TacosApiClient, mockApiClient as any);

    resourceService = container.resolve(ResourceService);
  });

  describe('getStock', () => {
    it('should fetch stock from backend', async () => {
      const mockStock = createMockStockAvailability();
      const mockCsrfToken = 'test-csrf-token';

      mockApiClient.refreshCsrfToken.mockResolvedValue({ csrfToken: mockCsrfToken, cookies: {} });
      mockApiClient.get.mockResolvedValue(mockStock);

      const result = await resourceService.getStock();

      expect(result).toEqual(mockStock);
      expect(mockApiClient.refreshCsrfToken).toHaveBeenCalled();
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/office/stock_management.php?type=all',
        expect.objectContaining({
          headers: { 'X-CSRF-Token': mockCsrfToken },
        })
      );
    });

    it('should fetch stock on every call', async () => {
      const mockStock = createMockStockAvailability();
      const mockCsrfToken = 'test-csrf-token';

      mockApiClient.refreshCsrfToken.mockResolvedValue({ csrfToken: mockCsrfToken, cookies: {} });
      mockApiClient.get.mockResolvedValue(mockStock);

      // First call
      await resourceService.getStock();
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);

      // Second call - should fetch again (no cache)
      await resourceService.getStock();
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('isInStock', () => {
    it('should return true if product is in stock', async () => {
      const mockStock = createMockStockAvailability();
      const mockCsrfToken = 'test-csrf-token';

      mockApiClient.refreshCsrfToken.mockResolvedValue({ csrfToken: mockCsrfToken, cookies: {} });
      mockApiClient.get.mockResolvedValue(mockStock);

      const result = await resourceService.isInStock('viandes', 'viande_hachee');

      expect(result).toBe(true);
    });

    it('should return false if product is not in stock', async () => {
      const mockStock = createMockStockAvailability();
      mockStock.viandes = {};
      const mockCsrfToken = 'test-csrf-token';

      mockApiClient.refreshCsrfToken.mockResolvedValue({ csrfToken: mockCsrfToken, cookies: {} });
      mockApiClient.get.mockResolvedValue(mockStock);

      const result = await resourceService.isInStock('viandes', 'non-existent');

      expect(result).toBe(false);
    });
  });
});

