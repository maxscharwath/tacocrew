/**
 * Order service for managing orders
 * @module services/order
 */

import { apiClient } from '../api/client';
import { logger } from '../utils/logger';
import {
  CreateOrderRequest,
  Order,
  OrderStatus,
  DeliveryDemand,
  TimeSlot,
} from '../types';

/**
 * Order Service
 */
export class OrderService {
  /**
   * Create and submit a new order
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    logger.debug('Creating order', {
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

    const response = await apiClient.postFormData<Order>('/ajax/RocknRoll.php', formData);

    logger.info('Order created successfully', {
      orderId: response.orderId,
      price: response.OrderData.price,
    });

    return response;
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<{ orderId: string; status: OrderStatus }> {
    logger.debug('Getting order status', { orderId });

    const response = await apiClient.post<Array<{ orderId: string; status: OrderStatus }>>(
      '/ajax/oh.php',
      {
        orders: [{ orderId }],
      }
    );

    const orderStatus = response[0];
    if (!orderStatus) {
      throw new Error('Order not found');
    }

    logger.info('Order status fetched', { orderId, status: orderStatus.status });
    return orderStatus;
  }

  /**
   * Get statuses for multiple orders
   */
  async getOrderStatuses(
    orderIds: string[]
  ): Promise<Array<{ orderId: string; status: OrderStatus }>> {
    logger.debug('Getting order statuses', { count: orderIds.length });

    const response = await apiClient.post<Array<{ orderId: string; status: OrderStatus }>>(
      '/ajax/oh.php',
      {
        orders: orderIds.map((orderId) => ({ orderId })),
      }
    );

    logger.info('Order statuses fetched', { count: response.length });
    return response;
  }

  /**
   * Restore previous order to cart
   */
  async restoreOrder(order: Order): Promise<{ success: boolean; outOfStock: string[] }> {
    logger.debug('Restoring order', { orderId: order.orderId });

    const response = await apiClient.post<{
      status: 'success' | 'warning';
      out_of_stock_items: string[];
    }>('/ajax/restore_order.php', { order });

    const outOfStock = response.out_of_stock_items || [];

    logger.info('Order restored', {
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
   */
  async checkDeliveryDemand(time: string): Promise<DeliveryDemand> {
    logger.debug('Checking delivery demand', { time });

    const response = await apiClient.post<{
      status: string;
      is_high_demand: boolean;
      message?: string;
    }>('/ajax/check_delivery_demand.php', { time });

    return {
      time,
      isHighDemand: response.is_high_demand,
      message: response.message,
    };
  }

  /**
   * Get all time slots with demand information
   */
  async getTimeSlots(): Promise<TimeSlot[]> {
    logger.debug('Fetching time slots with demand info');

    const response = await apiClient.post<{
      status: string;
      time_slots: Record<string, { is_high_demand: boolean }>;
    }>('/ajax/check_delivery_demand.php', { check_all: true });

    const slots: TimeSlot[] = Object.entries(response.time_slots).map(([time, data]) => ({
      time,
      available: true,
      highDemand: data.is_high_demand,
    }));

    logger.info('Time slots fetched', { count: slots.length });
    return slots;
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
