/**
 * Session-aware order service for managing orders
 * @module services/order
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { SessionApiClient } from '../api/session-client';
import { CreateOrderRequest, DeliveryDemand, Order, OrderStatus, TimeSlot } from '../types';
import { NotFoundError } from '../utils/errors';
import { inject } from '../utils/inject';
import { logger } from '../utils/logger';
import { CartService } from './cart.service';

/**
 * Order Service - Session-aware
 * All operations require a sessionId
 */
@injectable()
export class OrderService {
  private readonly sessionApiClient = inject(SessionApiClient);
  private readonly cartService = inject(CartService);

  /**
   * Validate that cart exists for sessionId (cartId)
   */
  private async validateCart(cartId: string): Promise<void> {
    if (!cartId) {
      throw new NotFoundError('Cart ID is required');
    }

    // This will throw if cart doesn't exist
    await this.cartService.getCartSession(cartId);
  }

  /**
   * Create and submit a new order for a session
   */
  async createOrder(sessionId: string, request: CreateOrderRequest): Promise<Order> {
    await this.validateCart(sessionId);
    logger.debug('Creating order', {
      sessionId,
      customerName: request.customer.name,
      orderType: request.delivery.type,
    });

    const transactionId = this.generateTransactionId();

    const formData: Record<string, unknown> = {
      name: request.customer.name,
      phone: request.customer.phone,
      confirmPhone: request.customer.phone,
      type: request.delivery.type,
      requestedFor: request.delivery.requestedFor,
      transaction_id: transactionId,
    };

    const deliveryAddress = request.delivery['address'];
    if (deliveryAddress) {
      formData['address'] = deliveryAddress;
    }

    const response = await this.sessionApiClient.postFormData<Order>(
      sessionId,
      '/ajax/RocknRoll.php',
      formData
    );

    logger.info('Order created successfully', {
      sessionId,
      orderId: response.orderId,
      price: response.OrderData.price,
    });

    return response;
  }

  /**
   * Get order status
   * Note: This doesn't require sessionId as it's checking existing order
   */
  getOrderStatus(orderId: string): Promise<{ orderId: string; status: OrderStatus }> {
    logger.debug('Getting order status', { orderId });

    // This could use a temporary session or default client
    // For now, we'll need to pass a sessionId or use the original apiClient
    // Would need a helper method to make requests without full session context
    // For now, throwing error to indicate this needs implementation
    return Promise.reject(
      new Error('getOrderStatus needs implementation for sessionless requests')
    );
  }

  /**
   * Get statuses for multiple orders
   */
  getOrderStatuses(orderIds: string[]): Promise<Array<{ orderId: string; status: OrderStatus }>> {
    logger.debug('Getting order statuses', { count: orderIds.length });

    // Similar to getOrderStatus, needs sessionless implementation
    return Promise.reject(
      new Error('getOrderStatuses needs implementation for sessionless requests')
    );
  }

  /**
   * Restore previous order to cart (for a specific session)
   */
  async restoreOrder(
    sessionId: string,
    order: Order
  ): Promise<{ success: boolean; outOfStock: string[] }> {
    await this.validateCart(sessionId);
    logger.debug('Restoring order', { sessionId, orderId: order.orderId });

    const response = await this.sessionApiClient.post<{
      status: 'success' | 'warning';
      out_of_stock_items: string[];
    }>(sessionId, '/ajax/restore_order.php', { order });

    const outOfStock = response.out_of_stock_items || [];

    logger.info('Order restored', {
      sessionId,
      orderId: order.orderId,
      hasWarnings: response.status === 'warning',
      outOfStockCount: outOfStock.length,
    });

    return {
      success: response.status === 'success',
      outOfStock,
    };
  }

  /**
   * Check delivery demand for specific time slot
   * Note: This is global, not session-specific
   */
  checkDeliveryDemand(time: string): Promise<DeliveryDemand> {
    logger.debug('Checking delivery demand', { time });

    // Would need sessionless request capability
    return Promise.reject(
      new Error('checkDeliveryDemand needs implementation for sessionless requests')
    );
  }

  /**
   * Get all time slots with demand information
   * Note: This is global, not session-specific
   */
  getTimeSlots(): Promise<TimeSlot[]> {
    logger.debug('Fetching time slots with demand info');

    // Would need sessionless request capability
    return Promise.reject(new Error('getTimeSlots needs implementation for sessionless requests'));
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${random}`;
  }
}
