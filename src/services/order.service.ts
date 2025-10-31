/**
 * Session-aware order service for managing orders
 * @module services/order
 */

import { sessionApiClient } from '../api/session-client';
import { logger } from '../utils/logger';
import { CreateOrderRequest, Order, OrderStatus, DeliveryDemand, TimeSlot } from '../types';

/**
 * Order Service - Session-aware
 * All operations require a sessionId
 */
export class OrderService {
  /**
   * Create and submit a new order for a session
   */
  async createOrder(sessionId: string, request: CreateOrderRequest): Promise<Order> {
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

    if (request.delivery.address) {
      formData.address = request.delivery.address;
    }

    const response = await sessionApiClient.postFormData<Order>(
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
  async getOrderStatus(orderId: string): Promise<{ orderId: string; status: OrderStatus }> {
    logger.debug('Getting order status', { orderId });

    // This could use a temporary session or default client
    // For now, we'll need to pass a sessionId or use the original apiClient
    // Let's create a temporary session for status checks
    const response = await sessionApiClient.refreshCsrfToken();
    
    // Would need a helper method to make requests without full session context
    // For now, throwing error to indicate this needs implementation
    throw new Error('getOrderStatus needs implementation for sessionless requests');
  }

  /**
   * Get statuses for multiple orders
   */
  async getOrderStatuses(
    orderIds: string[]
  ): Promise<Array<{ orderId: string; status: OrderStatus }>> {
    logger.debug('Getting order statuses', { count: orderIds.length });

    // Similar to getOrderStatus, needs sessionless implementation
    throw new Error('getOrderStatuses needs implementation for sessionless requests');
  }

  /**
   * Restore previous order to cart (for a specific session)
   */
  async restoreOrder(
    sessionId: string,
    order: Order
  ): Promise<{ success: boolean; outOfStock: string[] }> {
    logger.debug('Restoring order', { sessionId, orderId: order.orderId });

    const response = await sessionApiClient.post<{
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
  async checkDeliveryDemand(time: string): Promise<DeliveryDemand> {
    logger.debug('Checking delivery demand', { time });

    // Would need sessionless request capability
    throw new Error('checkDeliveryDemand needs implementation for sessionless requests');
  }

  /**
   * Get all time slots with demand information
   * Note: This is global, not session-specific
   */
  async getTimeSlots(): Promise<TimeSlot[]> {
    logger.debug('Fetching time slots with demand info');

    // Would need sessionless request capability
    throw new Error('getTimeSlots needs implementation for sessionless requests');
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

export const orderService = new OrderService();
export default orderService;
