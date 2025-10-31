/**
 * Group Order Storage Service
 * Manages in-memory storage for group orders
 */

import { GroupOrder, GroupOrderStatus } from '@/types';
import { logger } from '@/utils/logger';

/**
 * In-memory storage for group orders
 */
class GroupOrderStorage {
  private orders: Map<string, GroupOrder> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to remove expired orders
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of expired orders
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredOrders();
    }, 60000); // Check every minute
  }

  /**
   * Cleanup expired orders
   */
  private cleanupExpiredOrders(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [id, order] of this.orders.entries()) {
      if (order.status === 'active' && order.expiresAt < now) {
        order.status = 'expired';
        cleaned++;
        logger.debug(`Group order ${id} expired`);
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired group orders`);
    }
  }

  /**
   * Store a group order
   */
  set(orderId: string, order: GroupOrder): void {
    this.orders.set(orderId, order);
  }

  /**
   * Get a group order by ID
   */
  get(orderId: string): GroupOrder | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Check if a group order exists
   */
  has(orderId: string): boolean {
    return this.orders.has(orderId);
  }

  /**
   * Delete a group order
   */
  delete(orderId: string): boolean {
    return this.orders.delete(orderId);
  }

  /**
   * Get all active group orders
   */
  getAllActive(): GroupOrder[] {
    return Array.from(this.orders.values()).filter(
      (order) => order.status === 'active'
    );
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Singleton instance
 */
const storage = new GroupOrderStorage();

/**
 * Get group order storage instance
 */
export function getGroupOrderStorage(): GroupOrderStorage {
  return storage;
}
