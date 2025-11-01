/**
 * Cart repository for managing carts with session data
 * @module database/cart
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { CartMetadata } from '../types';
import { inject } from '../utils/inject';
import { logger } from '../utils/logger';
import { PrismaService } from './prisma.service';

/**
 * Repository for managing carts with session data
 */
@injectable()
export class CartRepository {
  private readonly prisma = inject(PrismaService);

  /**
   * Get cart with session data by cartId
   */
  async getCart(cartId: string): Promise<CartMetadata | null> {
    try {
      const cart = await this.prisma.client.cart.findUnique({
        where: { cartId },
      });

      if (!cart) {
        return null;
      }

      // Update last activity
      await this.prisma.client.cart.update({
        where: { cartId },
        data: { lastActivityAt: new Date() },
      });

      return this.mapToCartMetadata(cart);
    } catch (error) {
      logger.error('Failed to get cart', { cartId, error });
      return null;
    }
  }

  /**
   * Create a new cart with session data
   */
  async createCart(cartId: string, metadata: CartMetadata): Promise<void> {
    try {
      await this.prisma.client.cart.create({
        data: {
          cartId,
          csrfToken: '', // CSRF tokens are fetched per-request, not stored
          cookies: JSON.stringify(metadata.cookies),
          metadata: metadata.metadata ? JSON.stringify(metadata.metadata) : null,
          createdAt: metadata.createdAt,
          lastActivityAt: metadata.lastActivityAt,
        },
      });
      logger.debug('Cart created', { cartId });
    } catch (error) {
      logger.error('Failed to create cart', { cartId, error });
      throw error;
    }
  }

  /**
   * Update cart session data
   */
  async updateCart(cartId: string, metadata: Partial<CartMetadata>): Promise<void> {
    try {
      // If updating cookies, merge with existing cookies to prevent race conditions
      let cookiesToUpdate: string | undefined;
      if (metadata.cookies) {
        // Read current cart to merge cookies
        const currentCart = await this.prisma.client.cart.findUnique({
          where: { cartId },
          select: { cookies: true },
        });

        if (currentCart) {
          const currentCookies = JSON.parse(currentCart.cookies) as Record<string, string>;
          const mergedCookies = { ...currentCookies, ...metadata.cookies };
          cookiesToUpdate = JSON.stringify(mergedCookies);
        } else {
          // Cart doesn't exist, use provided cookies as-is
          cookiesToUpdate = JSON.stringify(metadata.cookies);
        }
      }

      const updateData: {
        cookies?: string;
        metadata?: string | null;
        lastActivityAt?: Date;
      } = {
        lastActivityAt: new Date(),
      };

      // CSRF tokens are no longer stored - fetched fresh per request

      if (cookiesToUpdate) {
        updateData.cookies = cookiesToUpdate;
      }

      if (metadata.metadata !== undefined) {
        updateData.metadata = metadata.metadata ? JSON.stringify(metadata.metadata) : null;
      }

      await this.prisma.client.cart.update({
        where: { cartId },
        data: updateData,
      });

      logger.debug('Cart updated', { cartId });
    } catch (error) {
      logger.error('Failed to update cart', { cartId, error });
      throw error;
    }
  }

  /**
   * Check if cart exists
   */
  async hasCart(cartId: string): Promise<boolean> {
    try {
      const count = await this.prisma.client.cart.count({
        where: { cartId },
      });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check cart existence', { cartId, error });
      return false;
    }
  }

  /**
   * Delete cart
   */
  async deleteCart(cartId: string): Promise<void> {
    try {
      await this.prisma.client.cart.delete({
        where: { cartId },
      });
      logger.info('Cart deleted', { cartId });
    } catch (error) {
      logger.error('Failed to delete cart', { cartId, error });
      // Don't throw if cart doesn't exist
    }
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts(maxAgeMs: number): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - maxAgeMs);

      const result = await this.prisma.client.cart.deleteMany({
        where: {
          lastActivityAt: {
            lt: cutoff,
          },
        },
      });

      if (result.count > 0) {
        logger.info('Cart cleanup completed', {
          cleaned: result.count,
        });
      }

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup carts', { error });
      return 0;
    }
  }

  /**
   * Map database model to CartMetadata
   */
  private mapToCartMetadata(cart: {
    cartId: string;
    csrfToken: string;
    cookies: string;
    metadata: string | null;
    createdAt: Date;
    lastActivityAt: Date;
  }): CartMetadata {
    const cookiesParsed = JSON.parse(cart.cookies) as Record<string, string>;
    const metadataParsed = cart.metadata
      ? (JSON.parse(cart.metadata) as CartMetadata['metadata'])
      : undefined;

    return {
      // CSRF tokens are no longer stored - fetched fresh per request
      cookies: cookiesParsed,
      metadata: metadataParsed,
      createdAt: cart.createdAt,
      lastActivityAt: cart.lastActivityAt,
    };
  }
}

