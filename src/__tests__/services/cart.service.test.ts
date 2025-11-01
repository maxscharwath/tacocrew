/**
 * Unit tests for CartService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { CartService } from '../../services/cart.service';
import { CartRepository } from '../../database/cart.repository';
import { TacoMappingRepository } from '../../database/taco-mapping.repository';
import { SessionApiClient } from '../../api/session-client';
import { TacosApiClient } from '../../api/client';
import { NotFoundError } from '../../utils/errors';
import { TacoSize } from '../../types';
import {
  createMockCartRepository,
  createMockTacoMappingRepository,
  createMockSessionApiClient,
  createMockTacosApiClient,
  createMockCartMetadata,
  createMockTaco,
} from '../mocks';

describe('CartService', () => {
  let cartService: CartService;
  let mockCartRepository: ReturnType<typeof createMockCartRepository>;
  let mockTacoMappingRepository: ReturnType<typeof createMockTacoMappingRepository>;
  let mockSessionApiClient: ReturnType<typeof createMockSessionApiClient>;
  let mockTacosApiClient: ReturnType<typeof createMockTacosApiClient>;

  beforeEach(() => {
    // Clear container
    container.clearInstances();

    // Create mocks
    mockCartRepository = createMockCartRepository();
    mockTacoMappingRepository = createMockTacoMappingRepository();
    mockSessionApiClient = createMockSessionApiClient();
    mockTacosApiClient = createMockTacosApiClient();

    // Register mocks
    container.registerInstance(CartRepository, mockCartRepository as any);
    container.registerInstance(TacoMappingRepository, mockTacoMappingRepository as any);
    container.registerInstance(SessionApiClient, mockSessionApiClient as any);
    container.registerInstance(TacosApiClient, mockTacosApiClient as any);

    // Create service instance
    cartService = container.resolve(CartService);
  });

  describe('createCart', () => {
    it('should create a new cart with session data', async () => {
      const mockCartId = 'test-cart-id';
      const mockCsrfToken = 'test-csrf-token';
      const mockMetadata = { ip: '127.0.0.1', userAgent: 'test-agent' };

      mockTacosApiClient.refreshCsrfToken.mockResolvedValue({ csrfToken: mockCsrfToken, cookies: {} });
      mockCartRepository.createCart.mockResolvedValue(undefined);

      const result = await cartService.createCart(mockMetadata);

      expect(result).toHaveProperty('cartId');
      expect(mockTacosApiClient.refreshCsrfToken).toHaveBeenCalled();
      expect(mockCartRepository.createCart).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          csrfToken: mockCsrfToken,
          cookies: {},
          metadata: mockMetadata,
        })
      );
    });

    it('should create cart without metadata', async () => {
      mockTacosApiClient.refreshCsrfToken.mockResolvedValue({ csrfToken: 'token', cookies: {} });
      mockCartRepository.createCart.mockResolvedValue(undefined);

      const result = await cartService.createCart();

      expect(result).toHaveProperty('cartId');
      expect(mockCartRepository.createCart).toHaveBeenCalled();
    });
  });

  describe('getCart', () => {
    it('should return cart with session data', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();
      const mockTacos: any[] = [];

      mockCartRepository.getCart.mockResolvedValue(mockMetadata);
      mockSessionApiClient.post.mockResolvedValue('<html></html>');
      mockTacoMappingRepository.getAllMappings.mockResolvedValue(new Map());

      const result = await cartService.getCart(cartId);

      expect(result).toHaveProperty('cartId', cartId);
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('tacos');
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
      mockSessionApiClient.postForm.mockResolvedValue('<html><select name="selectProduct" value="tacos_XL"></select></html>');
      mockCartRepository.getCart.mockResolvedValueOnce(mockMetadata);
      mockSessionApiClient.post.mockResolvedValue('<html></html>');
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
      const htmlResponse = '<div class="card"><select name="selectProduct" value="tacos_XL"></select></div>';

      mockCartRepository.getCart.mockResolvedValue(mockMetadata);
      mockSessionApiClient.post.mockResolvedValue(htmlResponse);
      mockTacoMappingRepository.getAllMappings.mockResolvedValue(new Map());

      const result = await cartService.getTacos(cartId);

      expect(Array.isArray(result)).toBe(true);
      expect(mockSessionApiClient.post).toHaveBeenCalledWith(
        cartId,
        '/ajax/owt.php',
        { loadProducts: true }
      );
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

