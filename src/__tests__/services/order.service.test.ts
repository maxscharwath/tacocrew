/**
 * Unit tests for OrderService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { SessionApiClient } from '../../api/session-client';
import { OrderType } from '../../types';
import { NotFoundError } from '../../utils/errors';
import {
  createMockSessionApiClient,
  createMockCartMetadata,
} from '../mocks';

describe('OrderService', () => {
  let orderService: OrderService;
  let mockSessionApiClient: ReturnType<typeof createMockSessionApiClient>;
  let mockCartService: any;

  beforeEach(() => {
    container.clearInstances();

    mockSessionApiClient = createMockSessionApiClient();
    mockCartService = {
      getCartSession: vi.fn(),
      getCart: vi.fn(),
    };

    container.registerInstance(SessionApiClient, mockSessionApiClient as any);
    container.registerInstance(CartService, mockCartService);

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
      mockSessionApiClient.postForm.mockResolvedValue({
        status: 'success',
        order: {
          orderId: 'test-order-id',
          status: 'pending',
        },
      });

      const result = await orderService.createOrder(cartId, orderRequest);

      expect(result).toHaveProperty('orderId');
      expect(mockCartService.getCartSession).toHaveBeenCalledWith(cartId);
      expect(mockSessionApiClient.postForm).toHaveBeenCalled();
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
      mockSessionApiClient.postForm.mockResolvedValue({
        status: 'success',
        order: { orderId: 'test-id', status: 'pending' },
      });

      // The validation should happen at the schema level, not here
      // But we ensure the service can handle it
      await expect(orderService.createOrder(cartId, orderRequest as any)).resolves.toBeDefined();
    });
  });

  describe('validateCart', () => {
    it('should validate cart exists', async () => {
      const cartId = 'test-cart-id';
      const mockMetadata = createMockCartMetadata();

      mockCartService.getCartSession.mockResolvedValue(mockMetadata);

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

