/**
 * Backend order submission service
 * Submits orders to the real backend API
 * @module services/order
 */

import { randomBytes } from 'crypto';
import { injectable } from 'tsyringe';
import { SessionApiClient } from '@/infrastructure/api/session-api.client';
import type { SessionId } from '@/schemas/session.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { SessionService } from '@/services/session/session.service';
import type { Customer, DeliveryInfo } from '@/shared/types/types';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

/**
 * Backend order submission service
 * Handles submitting orders to the real backend API
 */
@injectable()
export class BackendOrderSubmissionService {
  private readonly sessionApiClient = inject(SessionApiClient);
  private readonly sessionService = inject(SessionService);

  /**
   * Submit multiple user orders as a single combined order to the backend
   * Creates a cart, adds all items from all user orders, and submits to RocknRoll.php
   */
  async submitGroupOrder(
    userOrders: UserOrder[],
    customer: Customer,
    delivery: DeliveryInfo
  ): Promise<{ orderId: string; transactionId: string; orderData: unknown }> {
    // Create a new session for this combined order
    const session = await this.sessionService.createSession({
      metadata: {
        customerName: customer.name,
        orderType: delivery.type,
      },
    });
    const sessionId = session.sessionId;

    try {
      // Combine all items from all user orders
      const combinedItems = this.combineUserOrderItems(userOrders);

      // Add all combined items to cart
      await this.addItemsToCart(sessionId, combinedItems);

      // Generate transaction ID (format: timestamp_random)
      const transactionId = `${Date.now()}_${randomBytes(8).toString('hex')}`;

      // Submit order to backend
      const orderResult = await this.sessionApiClient.postFormData<{
        orderId: string;
        OrderData: unknown;
      }>(sessionId, '/ajax/RocknRoll.php', {
        name: customer.name,
        phone: customer.phone,
        confirmPhone: customer.phone,
        address: delivery.address,
        type: delivery.type,
        requestedFor: delivery.requestedFor,
        transaction_id: transactionId,
      });


      return {
        orderId: orderResult.orderId,
        transactionId,
        orderData: orderResult.OrderData,
      };
    } finally {
      // Clean up session after submission
      try {
        await this.sessionService.deleteSession(sessionId);
      } catch (error) {
        logger.warn('Failed to delete session after order submission', {
          sessionId,
          error,
        });
      }
    }
  }

  /**
   * Combine items from all user orders into a single order
   */
  private combineUserOrderItems(userOrders: UserOrder[]): UserOrder['items'] {
    const combined: UserOrder['items'] = {
      tacos: [],
      extras: [],
      drinks: [],
      desserts: [],
    };

    for (const userOrder of userOrders) {
      combined.tacos.push(...userOrder.items.tacos);
      combined.extras.push(...userOrder.items.extras);
      combined.drinks.push(...userOrder.items.drinks);
      combined.desserts.push(...userOrder.items.desserts);
    }

    return combined;
  }

  /**
   * Add all items to cart
   */
  private async addItemsToCart(sessionId: SessionId, items: UserOrder['items']): Promise<void> {
    // Add all items in parallel for better performance
    await Promise.all([
      ...items.tacos.map((taco) => this.addTacoToCart(sessionId, taco)),
      ...items.extras.map((extra) => this.addExtraToCart(sessionId, extra)),
      ...items.drinks.map((drink) => this.addDrinkToCart(sessionId, drink)),
      ...items.desserts.map((dessert) => this.addDessertToCart(sessionId, dessert)),
    ]);
  }

  /**
   * Add a taco to cart using URL-encoded form data matching bundle.js format
   */
  private async addTacoToCart(
    sessionId: SessionId,
    taco: UserOrder['items']['tacos'][number]
  ): Promise<void> {
    const formData: Record<string, unknown> = {
      selectProduct: taco.size,
      tacosNote: taco.note ?? '',
      'viande[]': taco.meats.map((meat) => meat.code),
      'sauce[]': taco.sauces.map((sauce) => sauce.code),
      'garniture[]': taco.garnitures.map((garniture) => garniture.code),
    };

    // Add meat quantities (meat_quantity[{slug}])
    for (const meat of taco.meats) {
      formData[`meat_quantity[${meat.code}]`] = meat.quantity;
    }

    await this.sessionApiClient.postForm(sessionId, '/ajax/owt.php', formData);
  }

  /**
   * Add an extra to cart
   */
  private async addExtraToCart(
    sessionId: SessionId,
    extra: UserOrder['items']['extras'][number]
  ): Promise<void> {
    await this.sessionApiClient.post(sessionId, '/ajax/ues.php', {
      id: extra.code,
      name: extra.name,
      price: extra.price,
      quantity: extra.quantity,
      free_sauces: extra.free_sauces ?? [],
    });
  }

  /**
   * Add a drink to cart
   */
  private async addDrinkToCart(
    sessionId: SessionId,
    drink: UserOrder['items']['drinks'][number]
  ): Promise<void> {
    await this.sessionApiClient.post(sessionId, '/ajax/ubs.php', {
      id: drink.code,
      name: drink.name,
      price: drink.price,
      quantity: drink.quantity,
    });
  }

  /**
   * Add a dessert to cart
   */
  private async addDessertToCart(
    sessionId: SessionId,
    dessert: UserOrder['items']['desserts'][number]
  ): Promise<void> {
    await this.sessionApiClient.post(sessionId, '/ajax/uds.php', {
      id: dessert.code,
      name: dessert.name,
      price: dessert.price,
      quantity: dessert.quantity,
    });
  }
}
