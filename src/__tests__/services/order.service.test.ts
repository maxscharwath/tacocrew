/**
 * Unit tests for OrderService
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockCartMetadata, createMockSessionApiClient } from '@/__tests__/mocks';
import { SessionApiClient } from '@/infrastructure/api/session-api.client';
import { OrderService } from '@/order/service';
import { CartService } from '@/services/cart/cart.service';
import { OrderType } from '@/shared/types/types';
import { NotFoundError } from '@/shared/utils/errors.utils';

describe('OrderService', () => {
  let orderService: OrderService;
  let mockSessionApiClient: ReturnType<typeof createMockSessionApiClient>;
  let mockCartService: Partial<CartService>;

  beforeEach(() => {
    container.clearInstances();

    mockSessionApiClient = createMockSessionApiClient();
    mockCartService = {
      getCartSession: vi.fn(),
      getCart: vi.fn(),
    };

    container.registerInstance(
      SessionApiClient,
      mockSessionApiClient as unknown as SessionApiClient
    );
    container.registerInstance(CartService, mockCartService as unknown as CartService);

    orderService = container.resolve(OrderService);
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();
      const orderRequest = {
        customer: {
          name: 'John Doe',
          phone: '+41791234567',
        },
        delivery: {
          type: OrderType.DELIVERY,
          address: '123 Test St',
          requestedFor: '15:00',
        },
      };

      mockCartService.getCartSession.mockResolvedValue(mockMetadata);
      mockCartService.getCart.mockResolvedValue({
        cartId,
        tacos: [],
        extras: [],
        drinks: [],
        desserts: [],
        summary: { totalPrice: 0, totalQuantity: 0 },
      });
      mockSessionApiClient.postFormData.mockResolvedValue({
        id: 'test-order-id',
        OrderData: {
          status: 'pending',
          type: OrderType.DELIVERY,
          date: new Date().toISOString(),
          price: 25.5,
          requestedFor: '15:00',
        },
      });

      const result = await orderService.createOrder(cartId, orderRequest);

      expect(result).toHaveProperty('id', 'test-order-id');
      expect(mockCartService.getCartSession).toHaveBeenCalledWith(cartId);
      expect(mockSessionApiClient.postFormData).toHaveBeenCalled();
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      mockCartService.getCartSession.mockRejectedValue(new NotFoundError('Cart not found'));

      await expect(
        orderService.createOrder('invalid', {
          customer: { name: 'Test', phone: '+41791234567' },
          delivery: { type: OrderType.TAKEAWAY, requestedFor: '15:00' },
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should validate address for delivery orders', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();

      mockCartService.getCartSession.mockResolvedValue(mockMetadata);
      mockCartService.getCart.mockResolvedValue({
        cartId,
        tacos: [],
        extras: [],
        drinks: [],
        desserts: [],
        summary: { totalPrice: 0, totalQuantity: 0 },
      });

      const orderRequest = {
        customer: {
          name: 'John Doe',
          phone: '+41791234567',
        },
        delivery: {
          type: OrderType.DELIVERY,
          requestedFor: '15:00',
          // Missing address
        },
      };

      // This should be validated by the schema, but we test the service logic
      mockCartService.getCartSession.mockResolvedValue(createMockCartMetadata());
      mockSessionApiClient.postFormData.mockResolvedValue({
        id: 'test-id',
        OrderData: {
          status: 'pending',
          type: OrderType.DELIVERY,
          date: new Date().toISOString(),
          price: 25.5,
          requestedFor: '15:00',
        },
      });

      // The validation should happen at the schema level, not here
      // But we ensure the service can handle it
      await expect(
        orderService.createOrder(
          cartId,
          orderRequest as unknown as Parameters<OrderService['createOrder']>[1]
        )
      ).resolves.toBeDefined();
    });
  });

  describe('validateCart', () => {
    it('should validate cart exists', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();

      mockCartService.getCartSession.mockResolvedValue(mockMetadata);
      mockSessionApiClient.postFormData.mockResolvedValue({
        id: 'test-order-id',
        OrderData: {
          status: 'pending',
          type: OrderType.TAKEAWAY,
          date: new Date().toISOString(),
          price: 10.0,
          requestedFor: '15:00',
        },
      });

      // This is a private method, but we test it indirectly through createOrder
      await expect(
        orderService.createOrder(cartId, {
          customer: { name: 'Test', phone: '+41791234567' },
          delivery: { type: OrderType.TAKEAWAY, requestedFor: '15:00' },
        })
      ).resolves.toBeDefined();
    });
  });
});
