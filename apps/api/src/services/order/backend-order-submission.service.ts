/**
 * Backend order submission service
 * Submits orders to the real backend API
 * @module services/order
 */

import { randomBytes } from 'node:crypto';
import {
  OrderStatus,
  type OrderSubmissionResponse,
  type OrderSummary,
  PaymentMethod,
} from '@tacocrew/gigatacos-client';
import axios from 'axios';
import { injectable } from 'tsyringe';
import { BackendIntegrationClient } from '@/infrastructure/api/backend-integration.client';
import type { SessionId } from '@/schemas/session.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { ResourceService } from '@/services/resource/resource.service';
import { SessionService } from '@/services/session/session.service';
import type { Customer, DeliveryInfo } from '@/shared/types/types';
import { formatAddressForBackend } from '@/shared/utils/address-formatter.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { convertMysteryTacoToRegular } from '@/shared/utils/mystery-taco-converter.utils';
import { TacoKind } from '@/schemas/taco.schema';
import type { StockAvailability } from '@/shared/types/types';

/**
 * Backend order submission service
 * Handles submitting orders to the real backend API
 */
@injectable()
export class BackendOrderSubmissionService {
  private readonly backendIntegration = inject(BackendIntegrationClient);
  private readonly sessionService = inject(SessionService);
  private readonly resourceService = inject(ResourceService);

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
    orderData: OrderSubmissionResponse['OrderData'];
    sessionId: string;
    orderSummary: OrderSummary | null;
    dryRun?: boolean;
  }> {
    // Create a new session for this combined order
    const session = await this.sessionService.createSession();
    const sessionId = session.sessionId;

    try {
      // Get stock for generating mystery taco ingredients
      const stock = await this.resourceService.getStockForProcessing();
      
      // Combine all items from all user orders (converting mystery tacos to regular tacos)
      const combinedItems = this.combineUserOrderItems(userOrders, stock);

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

      let orderResult;

      if (dryRun) {
        logger.info('Dry run mode: Skipping RocknRoll.php submission', {
          sessionId,
          groupOrderId,
          transactionId,
        });

        // Create mock response matching the backend API structure
        // Note: Structure matches OrderSubmissionResponse from @tacocrew/gigatacos-client
        // where OrderData.price is string, not number
        orderResult = {
          success: true,
          orderId: `dry-run-${transactionId}`,
          tacos: [],
          extras: [],
          boissons: [],
          desserts: [],
          DeliveryData: {
            minOrderAmount: 0,
            postalcode: delivery.address.postcode,
            ville: delivery.address.city,
          },
          OrderData: {
            price: '0.00',
            time: 'NOW',
            totalPrice: 0,
            name: customer.name,
            phone: customer.phone,
            address: formatAddressForBackend(delivery.address),
            status: OrderStatus.PENDING,
            date: new Date().toISOString(),
            type: delivery.type,
            requestedFor: String(delivery.requestedFor),
          },
        };
      } else {
        const addressString = formatAddressForBackend(delivery.address);
        orderResult = await this.backendIntegration.submitOrder(sessionId, {
          name: customer.name,
          phone: customer.phone,
          confirmPhone: customer.phone,
          address: addressString,
          type: delivery.type,
          requestedFor: delivery.requestedFor,
          transaction_id: transactionId,
          payment_method: paymentMethod,
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
        orderSummary,
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
   * Converts mystery tacos to regular tacos with ingredients generated deterministically from taco ID
   */
  private combineUserOrderItems(
    userOrders: UserOrder[],
    stock: StockAvailability
  ): UserOrder['items'] {
    const combined: UserOrder['items'] = {
      tacos: [],
      extras: [],
      drinks: [],
      desserts: [],
    };

    for (const userOrder of userOrders) {
      // Convert mystery tacos to regular tacos with ingredients (generated deterministically from ID)
      const convertedTacos = userOrder.items.tacos.map((taco) => {
        if (taco.kind === TacoKind.MYSTERY) {
          // Generate ingredients deterministically using taco ID as seed
          return this.convertMysteryTacoToRegular(taco, stock);
        }
        return taco;
      });

      combined.tacos.push(...convertedTacos);
      combined.extras.push(...userOrder.items.extras);
      combined.drinks.push(...userOrder.items.drinks);
      combined.desserts.push(...userOrder.items.desserts);
    }

    return combined;
  }

  /**
   * Convert a mystery taco to a regular taco with ingredients generated deterministically from taco ID
   */
  private convertMysteryTacoToRegular(
    mysteryTaco: UserOrder['items']['tacos'][number],
    stock: StockAvailability
  ): UserOrder['items']['tacos'][number] {
    return convertMysteryTacoToRegular(mysteryTaco, stock);
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
    // All mystery tacos should have been converted to regular tacos in combineUserOrderItems
    if (taco.kind === 'mystery') {
      throw new Error(
        `Cannot submit mystery taco without ingredients. Taco ID: ${taco.id}. ` +
        'Mystery tacos should have been converted to regular tacos with deterministically generated ingredients.'
      );
    }

    // At this point, TypeScript knows taco is RegularTaco
    const meats = taco.meats;
    const sauces = taco.sauces;
    const garnitures = taco.garnitures;

    const formData = {
      taille: taco.size, // Use 'taille' instead of 'selectProduct'
      tacosNote: taco.note ?? '',
      'viande[]': meats.map((meat) => meat.code),
      'sauce[]': sauces.map((sauce) => sauce.code),
      'garniture[]': garnitures.map((garniture) => garniture.code),
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
    for (const meat of meats) {
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
