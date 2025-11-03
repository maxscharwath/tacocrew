/**
 * Session-aware order service for managing orders
 * @module services/order
 */

import { injectable } from 'tsyringe';
import { SessionApiClient } from '@/api/session-client';
import { PrismaService } from '@/database/prisma.service';
import type { OrderId } from '@/domain/schemas/order.schema';
import type { SessionId } from '@/domain/schemas/session.schema';
import type { UserId } from '@/domain/schemas/user.schema';
import { CartService } from '@/services/cart.service';
import { CreateOrderRequest, DeliveryDemand, OrderData, OrderStatus, TimeSlot } from '@/types';
import { NotFoundError } from '@/utils/errors';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';

type Order = {
  id: OrderId;
  OrderData: OrderData;
};

/**
 * Order Service - Session-aware
 * All operations require a sessionId
 */
@injectable()
export class OrderService {
  private readonly sessionApiClient = inject(SessionApiClient);
  private readonly cartService = inject(CartService);
  private readonly prismaService = inject(PrismaService);

  /**
   * Validate that cart exists for sessionId
   * Note: SessionId is the same as CartId - each cart ID serves as a session identifier
   */
  private async validateCart(sessionId: SessionId): Promise<void> {
    if (!sessionId) {
      throw new NotFoundError('Session ID is required');
    }

    // SessionId is CartId, so we can use it directly
    await this.cartService.getCartSession(sessionId);
  }

  /**
   * Create and submit a new order for a session
   */
  async createOrder(
    sessionId: SessionId,
    request: CreateOrderRequest,
    userId?: UserId
  ): Promise<Order> {
    await this.validateCart(sessionId);
    logger.debug('Creating order', {
      sessionId,
      userId,
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

    // Save order to database with userId if provided
    if (userId) {
      try {
        await this.prismaService.client.order.create({
          data: {
            cartId: sessionId, // SessionId is CartId
            userId,
            customerName: request.customer.name,
            customerPhone: request.customer.phone,
            orderType: request.delivery.type,
            address: deliveryAddress || null,
            requestedFor: request.delivery.requestedFor,
            status: response.OrderData.status,
            price: response.OrderData.price,
            orderData: JSON.stringify(response.OrderData),
          },
        });
      } catch (error) {
        logger.error('Failed to save order to database', { sessionId, error });
        // Don't fail the order creation if DB save fails
      }
    }

    logger.info('Order created successfully', {
      sessionId,
      userId,
      price: response.OrderData.price,
    });

    return response;
  }

  /**
   * Get order status
   * Note: This doesn't require sessionId as it's checking existing order
   */
  getOrderStatus(orderId: OrderId): Promise<{ orderId: OrderId; status: OrderStatus }> {
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
  getOrderStatuses(orderIds: OrderId[]): Promise<Array<{ orderId: OrderId; status: OrderStatus }>> {
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
    sessionId: SessionId,
    order: Order
  ): Promise<{ success: boolean; outOfStock: string[] }> {
    await this.validateCart(sessionId);
    logger.debug('Restoring order', { sessionId, orderId: order.id });

    const response = await this.sessionApiClient.post<{
      status: 'success' | 'warning';
      out_of_stock_items: string[];
    }>(sessionId, '/ajax/restore_order.php', { order });

    const outOfStock = response.out_of_stock_items || [];

    logger.info('Order restored', {
      sessionId,
      orderId: order.id,
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
