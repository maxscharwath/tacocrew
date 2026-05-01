/**
 * Backend order submission service
 *
 * Owns the translation between apps/api's `UserOrder` vocabulary and the
 * commande.app `CreateOrderInput` shape, then forwards to the adapter.
 * @module services/order
 */

import { randomBytes } from 'node:crypto';
import type {
  CreateOrderInput,
  OrderItem,
  OrderItemOption,
  PaymentMethod,
  ServiceType,
} from '@tacocrew/commande-client';
import { injectable } from 'tsyringe';
import { OrderType } from '@/domain/taco-config';
import {
  CommandeIntegrationClient,
  type PreflightResult,
} from '@/infrastructure/api/commande-integration.client';
import { TacoKind } from '@/schemas/taco.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { MenuResolver } from '@/services/order/menu-resolver';
import { ResourceService } from '@/services/resource/resource.service';
import { SessionService } from '@/services/session/session.service';
import { config } from '@/shared/config/app.config';
import type { Customer, DeliveryInfo, StockAvailability } from '@/shared/types/types';
import { formatAddressForBackend } from '@/shared/utils/address-formatter.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { convertMysteryTacoToRegular } from '@/shared/utils/mystery-taco-converter.utils';
import { calculateUserOrderPrice } from '@/shared/utils/order-price.utils';

/** Legacy payment-method slugs accepted by the public HTTP API. */
export const LEGACY_PAYMENT_METHODS = ['especes', 'carte', 'twint'] as const;
export type LegacyPaymentMethod = (typeof LEGACY_PAYMENT_METHODS)[number];

export type SubmitGroupOrderInput = {
  readonly userOrders: readonly UserOrder[];
  readonly customer: Customer;
  readonly delivery: DeliveryInfo;
  readonly groupOrderId?: string;
  readonly paymentMethod?: LegacyPaymentMethod;
  readonly dryRun?: boolean;
};

export type SubmitGroupOrderResult = {
  readonly orderId: string;
  readonly transactionId: string;
  readonly sessionId: string;
  readonly computedTotal: number;
  readonly backendTotal: number | null;
  readonly dryRun?: boolean;
  /** Populated only on dry run — the exact payload that would have been POSTed to commande.app. */
  readonly orderPreview?: CreateOrderInput;
  /** Populated only on dry run — server-side preflight result (restaurant status, delivery zone). */
  readonly preflight?: PreflightResult;
};

/**
 * Backend order submission service — translates internal user orders into a
 * commande.app `CreateOrderInput` and submits it via the integration client.
 */
@injectable()
export class BackendOrderSubmissionService {
  private readonly commande = inject(CommandeIntegrationClient);
  private readonly sessionService = inject(SessionService);
  private readonly resourceService = inject(ResourceService);

  /**
   * Submit the combined items of every user order in a group as a single
   * commande.app order.
   *
   * In `dryRun` mode we skip the remote call but still allocate a session
   * row so that downstream audit logic (sessionId persisted on the group
   * order) can reference a real record.
   */
  async submitGroupOrder(input: SubmitGroupOrderInput): Promise<SubmitGroupOrderResult> {
    const session = await this.sessionService.createSession();
    const sessionId = session.sessionId;
    const startedAt = Date.now();

    logger.debug('order.submit.start', {
      sessionId,
      groupOrderId: input.groupOrderId,
      userOrderCount: input.userOrders.length,
      dryRun: input.dryRun ?? false,
    });

    try {
      const fetchStart = Date.now();
      const [stock, menu] = await Promise.all([
        this.resourceService.getStockForProcessing(),
        this.commande.getMenu(config.commande.restaurantId),
      ]);
      logger.debug('order.submit.dependencies_loaded', {
        sessionId,
        groupOrderId: input.groupOrderId,
        durationMs: Date.now() - fetchStart,
      });

      const resolver = new MenuResolver(menu.products);
      const combinedItems = this.combineUserOrderItems(input.userOrders, stock);
      const computedTotal = input.userOrders.reduce(
        (sum, order) => sum + calculateUserOrderPrice(order.items),
        0
      );

      const transactionId = `${Date.now()}_${randomBytes(8).toString('hex')}`;

      const createOrderInput = this.buildCreateOrderInput(
        combinedItems,
        computedTotal,
        input.customer,
        input.delivery,
        input.paymentMethod,
        resolver
      );

      logger.debug('order.submit.payload_built', {
        sessionId,
        groupOrderId: input.groupOrderId,
        transactionId,
        itemCount: createOrderInput.items.length,
        serviceType: createOrderInput.serviceType,
        computedTotal,
      });

      if (input.dryRun) {
        logger.info('Dry run mode: skipping commande.app submission', {
          sessionId,
          groupOrderId: input.groupOrderId,
          transactionId,
          itemCount: createOrderInput.items.length,
        });
        const preflight = await this.runPreflight(input, sessionId);
        return {
          orderId: `dry-run-${transactionId}`,
          transactionId,
          sessionId,
          computedTotal,
          backendTotal: null,
          dryRun: true,
          orderPreview: createOrderInput,
          ...(preflight !== undefined && { preflight }),
        };
      }

      const remoteStart = Date.now();
      const response = await this.commande.submitOrder(createOrderInput);

      logger.info('Order submitted to commande.app', {
        sessionId,
        orderId: response.orderId,
        transactionId,
        groupOrderId: input.groupOrderId,
        remoteDurationMs: Date.now() - remoteStart,
        totalDurationMs: Date.now() - startedAt,
      });

      return {
        orderId: response.orderId,
        transactionId: response.transactionId ?? transactionId,
        sessionId,
        computedTotal,
        backendTotal: response.total ?? null,
      };
    } catch (error) {
      logger.error('Failed to submit order', {
        sessionId,
        groupOrderId: input.groupOrderId,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Build a commande.app-ready items list for an existing group order without
   * submitting. Used by the injection-preview endpoint so the UI can render a
   * localStorage snippet that materialises the same cart on commande.app.
   */
  async buildInjectionPreview(input: { readonly userOrders: readonly UserOrder[] }): Promise<{
    readonly restaurantId: string;
    readonly items: ReadonlyArray<OrderItem & { readonly productImage: string | null }>;
  }> {
    const [stock, menu] = await Promise.all([
      this.resourceService.getStockForProcessing(),
      this.commande.getMenu(config.commande.restaurantId),
    ]);
    const resolver = new MenuResolver(menu.products);
    const imagesByProductId = new Map<string, string | null>();
    for (const product of menu.products) {
      imagesByProductId.set(product.id, product.imageUrl ?? null);
    }
    const combined = this.combineUserOrderItems(input.userOrders, stock);
    const rawItems: OrderItem[] = [
      ...combined.tacos.map((taco) => this.tacoToOrderItem(taco, resolver)),
      ...combined.extras.map((extra) => this.extraToOrderItem(extra, resolver)),
      ...combined.drinks.map((drink) => this.simpleToOrderItem(drink, 'drink', resolver)),
      ...combined.desserts.map((dessert) => this.simpleToOrderItem(dessert, 'dessert', resolver)),
    ];
    const items = rawItems.map((item) => ({
      ...item,
      productImage: imagesByProductId.get(item.productId) ?? null,
    }));
    return { restaurantId: config.commande.restaurantId, items };
  }

  private combineUserOrderItems(
    userOrders: readonly UserOrder[],
    stock: StockAvailability
  ): UserOrder['items'] {
    const combined: UserOrder['items'] = {
      tacos: [],
      extras: [],
      drinks: [],
      desserts: [],
    };

    for (const userOrder of userOrders) {
      const convertedTacos = userOrder.items.tacos.map((taco) =>
        taco.kind === TacoKind.MYSTERY ? convertMysteryTacoToRegular(taco, stock) : taco
      );
      combined.tacos.push(...convertedTacos);
      combined.extras.push(...userOrder.items.extras);
      combined.drinks.push(...userOrder.items.drinks);
      combined.desserts.push(...userOrder.items.desserts);
    }

    return combined;
  }

  private buildCreateOrderInput(
    items: UserOrder['items'],
    computedTotal: number,
    customer: Customer,
    delivery: DeliveryInfo,
    paymentMethod: LegacyPaymentMethod | undefined,
    resolver: MenuResolver
  ): CreateOrderInput {
    const orderItems: OrderItem[] = [
      ...items.tacos.map((taco) => this.tacoToOrderItem(taco, resolver)),
      ...items.extras.map((extra) => this.extraToOrderItem(extra, resolver)),
      ...items.drinks.map((drink) => this.simpleToOrderItem(drink, 'drink', resolver)),
      ...items.desserts.map((dessert) => this.simpleToOrderItem(dessert, 'dessert', resolver)),
    ];

    const serviceType = this.toServiceType(delivery.type);
    const isDelivery = serviceType === 'delivery';

    return {
      restaurantId: config.commande.restaurantId,
      serviceType,
      items: orderItems,
      total: computedTotal,
      isPreorder: true,
      dineIn: false,
      isOnSite: false,
      deliveryFee: 0,
      customerName: customer.name,
      customerPhone: customer.phone,
      guestDeliveryAddress: isDelivery ? formatAddressForBackend(delivery.address) : null,
      paymentMethod: this.toCommandePaymentMethod(paymentMethod),
    };
  }

  private tacoToOrderItem(
    taco: UserOrder['items']['tacos'][number],
    resolver: MenuResolver
  ): OrderItem {
    if (taco.kind === 'mystery') {
      throw new Error(
        `Cannot submit mystery taco without ingredients. Taco ID: ${taco.id}. ` +
          'Mystery tacos should be converted before submission.'
      );
    }

    const product = resolver.resolveTacoProduct(taco.size);
    const productId = product.id;
    const options: OrderItemOption[] = [];

    for (const meat of taco.meats) {
      const resolved = resolver.resolveTacoOption(productId, 'meat', meat.code);
      options.push({
        groupId: resolved.groupId,
        groupName: resolved.groupName,
        itemId: resolved.optionId,
        itemName: meat.name,
        quantity: meat.quantity,
        extraPrice: 0,
      });
    }
    for (const sauce of taco.sauces) {
      const resolved = resolver.resolveTacoOption(productId, 'sauce', sauce.code);
      options.push({
        groupId: resolved.groupId,
        groupName: resolved.groupName,
        itemId: resolved.optionId,
        itemName: sauce.name,
        quantity: 1,
        extraPrice: 0,
      });
    }
    for (const garniture of taco.garnitures) {
      const resolved = resolver.resolveTacoOption(productId, 'garniture', garniture.code);
      options.push({
        groupId: resolved.groupId,
        groupName: resolved.groupName,
        itemId: resolved.optionId,
        itemName: garniture.name,
        quantity: 1,
        extraPrice: 0,
      });
    }

    return {
      productId,
      productName: product.name,
      quantity: 1,
      price: taco.price,
      options,
      note: taco.note ?? null,
    };
  }

  private extraToOrderItem(
    extra: UserOrder['items']['extras'][number],
    resolver: MenuResolver
  ): OrderItem {
    const productId = resolver.resolveCategoryProductId('extra', extra.code);
    // Free-sauce options: we can't resolve these through the menu (they live on
    // the extra's own option groups, which we don't model yet). Passed through
    // best-effort — commande.app ignores unknown option groups.
    const options: OrderItemOption[] = (extra.free_sauces ?? []).map((sauce) => ({
      groupId: 'free-sauce',
      groupName: 'Sauce offerte',
      itemId: sauce.code,
      itemName: sauce.name,
      quantity: 1,
      extraPrice: 0,
    }));
    return {
      productId,
      productName: extra.name,
      quantity: extra.quantity,
      price: extra.price,
      options,
    };
  }

  private simpleToOrderItem(
    item: UserOrder['items']['drinks'][number] | UserOrder['items']['desserts'][number],
    category: 'drink' | 'dessert',
    resolver: MenuResolver
  ): OrderItem {
    return {
      productId: resolver.resolveCategoryProductId(category, item.code),
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      options: [],
    };
  }

  private async runPreflight(
    input: SubmitGroupOrderInput,
    sessionId: string
  ): Promise<PreflightResult | undefined> {
    try {
      const serviceType = this.toServiceType(input.delivery.type);
      return await this.commande.preflightOrder({
        restaurantId: config.commande.restaurantId,
        serviceType,
        ...(input.delivery.address.postcode !== undefined && {
          postalCode: input.delivery.address.postcode,
        }),
        sessionId,
      });
    } catch (error) {
      logger.warn('Preflight checks failed; continuing dry-run without them', {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  // OrderType.TAKEAWAY is named "emporter" on our side; commande.app calls it "pickup".
  private toServiceType(orderType: OrderType): ServiceType {
    if (orderType === OrderType.DELIVERY) return 'delivery';
    return 'pickup';
  }

  private toCommandePaymentMethod(legacy?: LegacyPaymentMethod): PaymentMethod {
    if (legacy === 'carte') return 'card';
    if (legacy === 'especes') return 'cash';
    return 'twint';
  }
}
