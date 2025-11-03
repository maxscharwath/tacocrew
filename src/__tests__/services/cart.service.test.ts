/**
 * Unit tests for CartService
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockCartMetadata,
  createMockCartRepository,
  createMockSessionApiClient,
  createMockStockAvailability,
  createMockTaco,
  createMockTacoMappingRepository,
  createMockTacosApiClient,
} from '@/__tests__/mocks';
import { TacosApiClient } from '@/api/client';
import { SessionApiClient } from '@/api/session-client';
import { CartRepository } from '@/database/cart.repository';
import { TacoMappingRepository } from '@/database/taco-mapping.repository';
import { CartService } from '@/services/cart.service';
import { ResourceService } from '@/services/resource.service';
import { TacoSize } from '@/types';
import { NotFoundError } from '@/utils/errors';

describe('CartService', () => {
  let cartService: CartService;
  let mockCartRepository: ReturnType<typeof createMockCartRepository>;
  let mockTacoMappingRepository: ReturnType<typeof createMockTacoMappingRepository>;
  let mockSessionApiClient: ReturnType<typeof createMockSessionApiClient>;
  let mockTacosApiClient: ReturnType<typeof createMockTacosApiClient>;
  let mockResourceService: Partial<ResourceService>;

  beforeEach(() => {
    // Clear container
    container.clearInstances();

    // Create mocks
    mockCartRepository = createMockCartRepository();
    mockTacoMappingRepository = createMockTacoMappingRepository();
    mockSessionApiClient = createMockSessionApiClient();
    mockTacosApiClient = createMockTacosApiClient();

    // Register mocks
    container.registerInstance(CartRepository, mockCartRepository as unknown as CartRepository);
    container.registerInstance(
      TacoMappingRepository,
      mockTacoMappingRepository as unknown as TacoMappingRepository
    );
    container.registerInstance(
      SessionApiClient,
      mockSessionApiClient as unknown as SessionApiClient
    );
    container.registerInstance(TacosApiClient, mockTacosApiClient as unknown as TacosApiClient);

    mockResourceService = {
      getStock: vi.fn().mockResolvedValue(createMockStockAvailability()),
    };
    container.registerInstance(ResourceService, mockResourceService as unknown as ResourceService);

    // Create service instance
    cartService = container.resolve(CartService);
  });

  describe('createCart', () => {
    it('should create a new cart with session data', async () => {
      const mockCsrfToken = 'test-csrf-token';
      const mockMetadata = { ip: '127.0.0.1', userAgent: 'test-agent' };

      mockTacosApiClient.refreshCsrfToken.mockResolvedValue({
        csrfToken: mockCsrfToken,
        cookies: {},
      });
      mockCartRepository.createCart.mockResolvedValue({ id: 'cart-123' });

      const result = await cartService.createCart(mockMetadata);

      expect(result).toHaveProperty('id');
      expect(result.id).toBe('cart-123');
      expect(mockTacosApiClient.refreshCsrfToken).toHaveBeenCalled();
      expect(mockCartRepository.createCart).toHaveBeenCalledWith(
        expect.objectContaining({
          cookies: {},
          metadata: mockMetadata,
        })
      );
    });

    it('should create cart without metadata', async () => {
      mockTacosApiClient.refreshCsrfToken.mockResolvedValue({ csrfToken: 'token', cookies: {} });
      mockCartRepository.createCart.mockResolvedValue({ id: 'cart-456' });

      const result = await cartService.createCart();

      expect(result).toHaveProperty('id');
      expect(result.id).toBe('cart-456');
      expect(mockCartRepository.createCart).toHaveBeenCalled();
    });
  });

  describe('getCart', () => {
    it('should return array of tacos', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();

      mockCartRepository.getCart.mockResolvedValue(mockMetadata);
      mockSessionApiClient.post.mockResolvedValue(
        '<div class="card" id="tacos-0"><div class="card-body"><h5 class="card-title">Tacos XL - 12.50 CHF.</h5><p><strong>Viande</strong>: Viande Hachée x 1</p><p><strong>Sauce</strong>: Harissa</p><p><strong>Garniture</strong>: Salade</p></div></div>'
      );
      mockTacoMappingRepository.getAllMappings.mockResolvedValue(new Map());

      const result = await cartService.getCart(cartId);

      expect(Array.isArray(result)).toBe(true);
      expect(mockCartRepository.getCart).toHaveBeenCalledWith(cartId);
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      const cartId = 'non-existent-cart';

      mockCartRepository.getCart.mockResolvedValue(null);

      await expect(cartService.getCart(cartId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCartSession', () => {
    it('should return cart session metadata', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();

      mockCartRepository.getCart.mockResolvedValue(mockMetadata);

      const result = await cartService.getCartSession(cartId);

      expect(result).toEqual(mockMetadata);
      expect(mockCartRepository.getCart).toHaveBeenCalledWith(cartId);
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      mockCartRepository.getCart.mockResolvedValue(null);

      await expect(cartService.getCartSession('invalid')).rejects.toThrow(NotFoundError);
    });
  });

  describe('addTaco', () => {
    it('should add a taco to cart', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();
      const addTacoRequest = {
        size: TacoSize.XL,
        meats: [{ id: 'viande_hachee', quantity: 2 }],
        sauces: ['harissa'],
        garnitures: ['salade'],
        note: 'Test note',
      };

      mockCartRepository.getCart.mockResolvedValue(mockMetadata);
      mockSessionApiClient.postForm.mockResolvedValue(
        '<div class="card" id="tacos-0"><div class="card-body"><h5 class="card-title">Tacos XL - 12.50 CHF.</h5><p><strong>Viande</strong>: Viande Hachée x 2</p><p><strong>Sauce</strong>: Harissa</p><p><strong>Garniture</strong>: Salade</p><p><strong>Remarque</strong>: Test note</p></div></div>'
      );
      mockCartRepository.getCart.mockResolvedValueOnce(mockMetadata);
      mockSessionApiClient.post.mockResolvedValue(
        '<div class="card" id="tacos-0"><div class="card-body"><h5 class="card-title">Tacos XL - 12.50 CHF.</h5><p><strong>Viande</strong>: Viande Hachée x 2</p><p><strong>Sauce</strong>: Harissa</p><p><strong>Garniture</strong>: Salade</p></div></div>'
      );
      mockTacoMappingRepository.getAllMappings.mockResolvedValue(new Map());
      mockTacoMappingRepository.store.mockResolvedValue(undefined);

      const result = await cartService.addTaco(cartId, addTacoRequest);

      expect(result).toHaveProperty('id');
      expect(result.size).toBe(TacoSize.XL);
      expect(mockSessionApiClient.postForm).toHaveBeenCalled();
      expect(mockTacoMappingRepository.store).toHaveBeenCalled();
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      mockCartRepository.getCart.mockResolvedValue(null);

      await expect(
        cartService.addTaco('invalid', {
          size: TacoSize.XL,
          meats: [{ id: 'test', quantity: 1 }],
          sauces: [],
          garnitures: [],
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTacos', () => {
    it('should return tacos from cart', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();
      const htmlResponse =
        '<div class="card"><select name="selectProduct" value="tacos_XL"></select></div>';

      mockCartRepository.getCart.mockResolvedValue(mockMetadata);
      mockSessionApiClient.post.mockResolvedValue(htmlResponse);
      mockTacoMappingRepository.getAllMappings.mockResolvedValue(new Map());

      const result = await cartService.getCart(cartId);

      expect(Array.isArray(result)).toBe(true);
      expect(mockSessionApiClient.post).toHaveBeenCalledWith(cartId, '/ajax/owt.php', {
        loadProducts: true,
      });
    });
  });

  describe('updateCartSession', () => {
    it('should update cart session data', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();
      const updates = { csrfToken: 'new-token' };

      mockCartRepository.getCart.mockResolvedValue(mockMetadata);
      mockCartRepository.updateCart.mockResolvedValue(undefined);

      await cartService.updateCartSession(cartId, updates);

      expect(mockCartRepository.updateCart).toHaveBeenCalledWith(cartId, updates);
    });
  });
});
