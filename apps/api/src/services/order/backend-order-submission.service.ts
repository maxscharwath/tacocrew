/**
 * Backend order submission service
 * Submits orders to the real backend API
 * @module services/order
 */

import { randomBytes } from 'node:crypto';
import { PaymentMethod } from '@tacobot/gigatacos-client';
import axios from 'axios';
import { injectable } from 'tsyringe';
import { BackendIntegrationClient } from '../../infrastructure/api/backend-integration.client';
import type { SessionId } from '../../schemas/session.schema';
import type { UserOrder } from '../../schemas/user-order.schema';
import type { Customer, DeliveryInfo } from '../../shared/types/types';
import { formatAddressForBackend } from '../../shared/utils/address-formatter.utils';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';
import { SessionService } from '../session/session.service';

/**
 * Backend order submission service
 * Handles submitting orders to the real backend API
 */
@injectable()
export class BackendOrderSubmissionService {
  private readonly backendIntegration = inject(BackendIntegrationClient);
  private readonly sessionService = inject(SessionService);

  /**
   * Submit multiple user orders as a single combined order to the backend
   * Creates a cart, adds all items from all user orders, and submits to RocknRoll.php
   * @param dryRun If true, skips the actual submission to RocknRoll.php but still creates session and cart
   */
  async submitGroupOrder(
    userOrders: UserOrder[],
    customer: Customer,
    delivery: DeliveryInfo,
    groupOrderId?: string,
    paymentMethod?: PaymentMethod,
    dryRun = false
  ): Promise<{
    orderId: string;
    transactionId: string;
    orderData: unknown;
    sessionId: string;
    dryRun?: boolean;
  }> {
    // Create a new session for this combined order
    const session = await this.sessionService.createSession();
    const sessionId = session.sessionId;

    try {
      // Combine all items from all user orders
      const combinedItems = this.combineUserOrderItems(userOrders);

      // Add all combined items to cart
      await this.addItemsToCart(sessionId, combinedItems);

      // Get order summary with totals and delivery fees from backend
      const orderSummary = await this.backendIntegration.getOrderSummary(sessionId);
      if (orderSummary) {
        logger.info('Order summary retrieved', {
          sessionId,
          cartTotal: orderSummary.cartTotal,
          deliveryFee: orderSummary.deliveryFee,
          totalAmount: orderSummary.totalAmount,
        });
      }

      // Generate transaction ID (format: timestamp_random)
      const transactionId = `${Date.now()}_${randomBytes(8).toString('hex')}`;

      let orderResult: { orderId: string; OrderData: unknown };

      if (dryRun) {
        // Dry run: Skip actual submission, create mock response
        logger.info('Dry run mode: Skipping RocknRoll.php submission', {
          sessionId,
          groupOrderId,
          transactionId,
        });

        orderResult = {
          orderId: `dry-run-${transactionId}`,
          OrderData: {
            dryRun: true,
            message: 'Order not submitted - dry run mode',
            sessionId,
            transactionId,
            customer: customer.name,
            deliveryType: delivery.type,
          },
        };
      } else {
        // Format address as string for backend API
        const addressString = formatAddressForBackend(delivery.address);

        // Submit order to backend
        orderResult = await this.backendIntegration.submitOrder(sessionId, {
          name: customer.name,
          phone: customer.phone,
          confirmPhone: customer.phone,
          address: addressString,
          type: delivery.type,
          requestedFor: delivery.requestedFor,
          transaction_id: transactionId,
          ...(paymentMethod && { payment_method: paymentMethod }),
        });
      }

      // Session is kept alive for order tracking - cookies are stored in session

      // Keep session alive for order tracking - don't delete it
      logger.info(
        dryRun
          ? 'Dry run completed, session kept for verification'
          : 'Order submitted, session kept for tracking',
        {
          sessionId,
          orderId: orderResult.orderId,
          transactionId,
          groupOrderId,
          dryRun,
        }
      );

      return {
        orderId: orderResult.orderId,
        transactionId,
        orderData: orderResult.OrderData,
        sessionId,
        ...(dryRun && { dryRun: true }),
      };
    } catch (error) {
      logger.error('Failed to submit order', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
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
    // Note: Desserts may fail with 404 if endpoint doesn't exist - handle gracefully
    await Promise.all([
      ...items.tacos.map((taco) => this.addTacoToCart(sessionId, taco)),
      ...items.extras.map((extra) => this.addExtraToCart(sessionId, extra)),
      ...items.drinks.map((drink) => this.addDrinkToCart(sessionId, drink)),
      ...items.desserts.map((dessert) =>
        this.addDessertToCart(sessionId, dessert).catch((error) => {
          // If dessert endpoint returns 404, log warning but don't fail the entire order
          // The HttpClient re-throws AxiosError, so check for 404 status
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            logger.warn('Dessert endpoint not available, skipping dessert', {
              sessionId,
              dessertId: dessert.code,
              dessertName: dessert.name,
            });
            return;
          }
          // Re-throw other errors
          throw error;
        })
      ),
    ]);
  }

  /**
   * Add a taco to cart using URL-encoded form data matching bundle.js format
   */
  private async addTacoToCart(
    sessionId: SessionId,
    taco: UserOrder['items']['tacos'][number]
  ): Promise<void> {
    const formData = {
      taille: taco.size, // Use 'taille' instead of 'selectProduct'
      tacosNote: taco.note ?? '',
      'viande[]': taco.meats.map((meat) => meat.code),
      'sauce[]': taco.sauces.map((sauce) => sauce.code),
      'garniture[]': taco.garnitures.map((garniture) => garniture.code),
    } as {
      taille: string;
      tacosNote: string;
      'viande[]': string[];
      'sauce[]': string[];
      'garniture[]': string[];
      [key: `meat_quantity[${string}]`]: number;
      [key: string]: string | string[] | number | undefined;
    };

    // Add meat quantities (meat_quantity[{slug}])
    for (const meat of taco.meats) {
      (formData as Record<string, number>)[`meat_quantity[${meat.code}]`] = meat.quantity;
    }

    const parsedTaco = await this.backendIntegration.addTacoToCart(sessionId, formData, taco.id);

    if (!parsedTaco) {
      logger.warn('Failed to parse taco card after adding to cart', {
        sessionId,
        tacoId: taco.id,
      });
    }
  }

  /**
   * Add an extra to cart
   */
  private async addExtraToCart(
    sessionId: SessionId,
    extra: UserOrder['items']['extras'][number]
  ): Promise<void> {
    await this.backendIntegration.addExtraToCart(sessionId, {
      id: extra.code,
      name: extra.name,
      price: extra.price,
      quantity: extra.quantity,
      free_sauces: extra.free_sauces?.map((sauce) => sauce.code) ?? [],
    });
  }

  /**
   * Add a drink to cart
   */
  private async addDrinkToCart(
    sessionId: SessionId,
    drink: UserOrder['items']['drinks'][number]
  ): Promise<void> {
    await this.backendIntegration.addDrinkToCart(sessionId, {
      id: drink.code,
      name: drink.name,
      price: drink.price,
      quantity: drink.quantity,
    });
  }

  /**
   * Add a dessert to cart
   * Note: usd.php endpoint may return 404 if it doesn't exist
   */
  private async addDessertToCart(
    sessionId: SessionId,
    dessert: UserOrder['items']['desserts'][number]
  ): Promise<void> {
    await this.backendIntegration.addDessertToCart(sessionId, {
      id: dessert.code,
      name: dessert.name,
      price: dessert.price,
      quantity: dessert.quantity,
    });
  }
}
