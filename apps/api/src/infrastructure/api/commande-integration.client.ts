/**
 * Commande integration client.
 *
 * Thin, taco-domain-friendly wrapper around `@tacocrew/commande-client`. Owns
 * only the translation from the generic commande.app primitives to the taco
 * vocabulary used by the services layer — no retry loops, no CSRF, no
 * sessions.
 *
 * Replaces the legacy `BackendIntegrationClient`; consumer swap happens in
 * phase 3b.
 */

import {
  type ActivePreorder,
  type Combination,
  CommandeClient,
  type CreateOrderInput,
  type CreateOrderResponse,
  type DeliveryZone,
  type GetMenuItemsResult,
  type OrderConfirmation,
  type OrderStatusUpdate,
  type PaymentMethod,
  type PotentialOrderResult,
  type Product,
  type Restaurant,
  type RestaurantStatus,
  type ServiceType,
} from '@tacocrew/commande-client';
import { injectable } from 'tsyringe';
import {
  type CroustyProduct,
  isCroustyProduct,
  mapProductToCrousty,
} from '@/domain/crousty-config';
import type { Promo } from '@/domain/promos';
import {
  classifyOptionGroup,
  classifyProductCategory,
  classifyTacoSize,
  mapProductToTaco,
  type StockAvailability,
  type StockInfo,
  type Taco,
  type TacoSize,
} from '@/domain/taco-config';
import { config } from '@/shared/config/app.config';
import { logger } from '@/shared/utils/logger.utils';

export type PollOrderInput = {
  readonly orderId: string;
  readonly restaurantId: string;
  readonly intervalMs?: number;
  readonly signal?: AbortSignal;
};

/**
 * Aggregated result of the preflight checks performed before submitting an
 * order. `ok` is `false` iff any blocking issue was detected (restaurant
 * closed, delivery unavailable).
 */
export type PreflightResult = {
  readonly ok: boolean;
  readonly restaurantStatus: RestaurantStatus;
  readonly deliveryZone?: DeliveryZone;
  readonly potentialOrderAck?: PotentialOrderResult;
  readonly issues: readonly string[];
};

/**
 * Injectable adapter wrapping `CommandeClient` for the rest of apps/api.
 *
 * Every public method forwards to one of the underlying resources, applying
 * a small amount of taco-domain mapping only where the service layer expects
 * it (menu → tacos, menu → stock).
 */
@injectable()
export class CommandeIntegrationClient {
  private readonly client: CommandeClient;

  /**
   * @param client Optional test-only override. In production the constructor
   *   builds the real `CommandeClient` from app config.
   */
  constructor(client?: CommandeClient) {
    if (client !== undefined) {
      this.client = client;
      return;
    }
    this.client = new CommandeClient({ baseUrl: config.commande.baseUrl, logger });
  }

  getMenu(restaurantId: string, signal?: AbortSignal): Promise<GetMenuItemsResult> {
    return this.client.menu.getMenuItems({ restaurantId }, { signal });
  }

  async getCombinations(
    restaurantId: string,
    signal?: AbortSignal
  ): Promise<readonly Combination[]> {
    const list = await this.client.menu.getCombinations({ restaurantId }, { signal });
    return list;
  }

  /**
   * Project commande.app combinations into our generic `Promo` model. Each
   * combo whose main product classifies as a TacoSize and whose side slot is
   * a drinks-category becomes a `free-item` promo. Combos that don't match
   * (no taco main, no recognised side category, etc.) are dropped silently.
   */
  async getPromos(restaurantId: string, signal?: AbortSignal): Promise<readonly Promo[]> {
    const [{ products }, combinations] = await Promise.all([
      this.client.menu.getMenuItems({ restaurantId }, { signal }),
      this.getCombinations(restaurantId, signal),
    ]);

    const tacoSizeByProductId = new Map<string, TacoSize>();
    const slugByProductId = new Map<string, string>();
    const productCategoryById = new Map<string, string | null>();
    for (const product of products) {
      const size = classifyTacoSize(product.name);
      if (size !== undefined) tacoSizeByProductId.set(product.id, size);
      slugByProductId.set(product.id, slugifyOptionName(product.name));
      productCategoryById.set(product.id, product.categoryId ?? null);
    }

    const promos: Promo[] = [];
    for (const combo of combinations) {
      if (!combo.isActive) continue;
      const mainSlot = combo.items.find((i) => i.isMainProduct);
      if (!mainSlot?.productId) continue;
      const tacoSize = tacoSizeByProductId.get(mainSlot.productId);
      if (tacoSize === undefined) continue;

      const sideSlots = combo.items.filter((i) => !i.isMainProduct);
      const totalRewardQty = sideSlots.reduce((s, slot) => s + slot.quantity, 0);
      if (totalRewardQty === 0) continue;

      // Resolve which app-domain category the side slots target by looking up
      // any product in the slot's commande.app categoryId and classifying it.
      const rewardCategory = inferRewardCategory(sideSlots, products, productCategoryById);
      if (rewardCategory === null) continue;

      const excluded = new Set<string>();
      for (const side of sideSlots) {
        for (const excludedId of side.excludedProductIds) {
          const slug = slugByProductId.get(excludedId);
          if (slug) excluded.add(slug);
        }
      }

      promos.push({
        kind: 'free-item',
        id: combo.id,
        name: combo.name,
        serviceTypes: combo.serviceTypes,
        trigger: { tacoSizes: [tacoSize], quantity: mainSlot.quantity },
        reward: {
          quantity: totalRewardQty,
          category: rewardCategory,
          excludedCodes: [...excluded],
        },
      });
    }

    return promos;
  }

  /**
   * Derive a taco-domain `StockAvailability` from the commande.app menu,
   * alongside a `TacoSize → imageUrl` map derived from the same products.
   *
   * Both outputs come from a single menu fetch — prefer this over calling
   * `getStockForProcessing` twice. Meats / sauces / garnitures are pulled
   * from taco products' option groups; drinks / desserts / extras are
   * inferred from the product's own name via `classifyProductCategory`. An
   * option/product is marked out-of-stock only when commande.app explicitly
   * reports `available === false`.
   */
  async getMenuSnapshot(
    restaurantId: string,
    signal?: AbortSignal
  ): Promise<{
    stock: StockAvailability;
    tacoImages: Readonly<Record<string, string | null>>;
    croustyProducts: readonly CroustyProduct[];
  }> {
    const { products } = await this.client.menu.getMenuItems({ restaurantId }, { signal });

    const buckets: StockBuckets = {
      viandes: {},
      sauces: {},
      garnitures: {},
      drinks: {},
      desserts: {},
      extras: {},
    };
    const tacoImages: Record<string, string | null> = {};
    const croustyProducts: CroustyProduct[] = [];

    for (const product of products) {
      const size = classifyTacoSize(product.name);
      if (size !== undefined) {
        collectTacoPartsFromProduct(product, buckets, size);
        if (!(size in tacoImages) && product.imageUrl) tacoImages[size] = product.imageUrl;
      } else if (isCroustyProduct(product)) {
        croustyProducts.push(mapProductToCrousty(product));
      } else {
        collectCategorizedProduct(product, buckets);
      }
    }

    return {
      stock: {
        viandes: buckets.viandes,
        sauces: buckets.sauces,
        garnitures: buckets.garnitures,
        desserts: buckets.desserts,
        boissons: buckets.drinks,
        extras: buckets.extras,
      },
      tacoImages,
      croustyProducts,
    };
  }

  /** Fetch just the Tasty Crousty products (with their full option groups). */
  async getCroustyProducts(
    restaurantId: string,
    signal?: AbortSignal
  ): Promise<readonly CroustyProduct[]> {
    const snapshot = await this.getMenuSnapshot(restaurantId, signal);
    return snapshot.croustyProducts;
  }

  async getStockForProcessing(
    restaurantId: string,
    signal?: AbortSignal
  ): Promise<StockAvailability> {
    const snapshot = await this.getMenuSnapshot(restaurantId, signal);
    return snapshot.stock;
  }

  /**
   * Fetch the menu and project every taco-sized product into a domain `Taco`.
   *
   * Products that don't match a known taco size are silently skipped — the
   * commande.app catalogue includes non-taco items (drinks, desserts, extras)
   * that this method is not meant to surface.
   */
  async getTacos(restaurantId: string, signal?: AbortSignal): Promise<Taco[]> {
    const { products } = await this.client.menu.getMenuItems({ restaurantId }, { signal });
    const tacos: Taco[] = [];
    for (const product of products) {
      if (classifyTacoSize(product.name) === undefined) continue;
      tacos.push(mapProductToTaco(product, []));
    }
    return tacos;
  }

  getRestaurantStatus(
    restaurantId: string,
    serviceType?: ServiceType,
    signal?: AbortSignal
  ): Promise<RestaurantStatus> {
    const input = serviceType === undefined ? { restaurantId } : { restaurantId, serviceType };
    return this.client.order.getRestaurantStatus(input, { signal });
  }

  getRestaurantBySlug(slug: string, signal?: AbortSignal): Promise<Restaurant> {
    return this.client.restaurant.getBySlug({ slug }, { signal });
  }

  getDeliveryZone(
    restaurantId: string,
    postalCode: string,
    signal?: AbortSignal
  ): Promise<DeliveryZone> {
    return this.client.delivery.getZoneByPostalCode({ restaurantId, postalCode }, { signal });
  }

  async getAvailablePaymentMethods(
    restaurantId: string,
    signal?: AbortSignal
  ): Promise<readonly PaymentMethod[]> {
    const response = await this.client.payment.getAvailableMethods({ restaurantId }, { signal });
    return response.methods;
  }

  /**
   * Validate that a would-be order is viable without creating one.
   *
   * commande.app's `potentialOrder.create` does *not* validate items — it
   * merely records a session-scoped intent and always returns
   * `{ success: true }`. The two endpoints that give us real signal are
   * `order.getRestaurantStatus` (open/busy) and (for delivery)
   * `deliveryZone.getByPostalCode` (serviceable + fee). We fan all three
   * out in parallel and consolidate the result.
   */
  async preflightOrder(input: {
    readonly restaurantId: string;
    readonly serviceType: ServiceType;
    readonly postalCode?: string;
    readonly sessionId?: string;
    readonly signal?: AbortSignal;
  }): Promise<PreflightResult> {
    const { restaurantId, serviceType, postalCode, sessionId, signal } = input;
    const needsDelivery = serviceType === 'delivery';
    const startedAt = Date.now();

    logger.debug('order.preflight.start', { restaurantId, serviceType, postalCode });

    const statusP = this.client.order.getRestaurantStatus(
      { restaurantId, serviceType },
      { signal }
    );
    const zoneP =
      needsDelivery && postalCode !== undefined
        ? this.client.delivery.getZoneByPostalCode({ restaurantId, postalCode }, { signal })
        : Promise.resolve(undefined);
    const potentialP =
      sessionId !== undefined && postalCode !== undefined
        ? this.client.order.potentialCreate({ restaurantId, sessionId, postalCode }, { signal })
        : Promise.resolve(undefined);

    const [restaurantStatus, deliveryZone, potentialOrderAck] = await Promise.all([
      statusP,
      zoneP,
      potentialP,
    ]);

    const issues: string[] = [];
    if (restaurantStatus.acceptingOrders === false) issues.push('restaurant_closed');
    if (needsDelivery && deliveryZone?.available === false) issues.push('delivery_unavailable');

    const ok = issues.length === 0;
    logger.info('order.preflight.result', {
      restaurantId,
      serviceType,
      ok,
      issues,
      durationMs: Date.now() - startedAt,
    });

    return {
      ok,
      restaurantStatus,
      ...(deliveryZone !== undefined && { deliveryZone }),
      ...(potentialOrderAck !== undefined && { potentialOrderAck }),
      issues,
    };
  }

  /**
   * Submit an order to commande.app.
   *
   * `RestaurantClosedError` (and other `CommandeError` subclasses) propagate
   * unchanged — the error middleware maps them to HTTP status codes.
   */
  submitOrder(input: CreateOrderInput, signal?: AbortSignal): Promise<CreateOrderResponse> {
    return this.client.order.create(input, { signal });
  }

  getOrderConfirmation(orderId: string, signal?: AbortSignal): Promise<OrderConfirmation> {
    return this.client.order.getOrderConfirmation({ orderId }, { signal });
  }

  getActivePreorders(
    restaurantId: string,
    signal?: AbortSignal
  ): Promise<readonly ActivePreorder[]> {
    return this.client.order.getActivePreorders({ restaurantId }, { signal });
  }

  /**
   * Poll an order's status until it terminates or the caller aborts.
   *
   * Returned iterable proxies directly to the underlying commande-client
   * poller — the integration layer adds no extra state.
   */
  pollOrder(opts: PollOrderInput): AsyncIterable<OrderStatusUpdate> {
    return this.client.tracking.pollOrder(opts);
  }

  /** Accessor for unusual call-sites that need the raw resources. */
  get underlying(): CommandeClient {
    return this.client;
  }
}

/** Only exported for external consumers that still expect these shapes. */
export type { StockAvailability, Taco } from '@/domain/taco-config';

/** Internal mutable buckets used while projecting a menu into `StockAvailability`. */
type StockBuckets = {
  readonly viandes: Record<string, StockInfo>;
  readonly sauces: Record<string, StockInfo>;
  readonly garnitures: Record<string, StockInfo>;
  readonly drinks: Record<string, StockInfo>;
  readonly desserts: Record<string, StockInfo>;
  readonly extras: Record<string, StockInfo>;
};

function pickTacoPartBucket(
  kind: 'meat' | 'sauce' | 'garniture',
  buckets: StockBuckets
): Record<string, StockInfo> {
  if (kind === 'meat') return buckets.viandes;
  if (kind === 'sauce') return buckets.sauces;
  return buckets.garnitures;
}

function pickCategoryBucket(
  category: 'drink' | 'dessert' | 'extra',
  buckets: StockBuckets
): Record<string, StockInfo> {
  if (category === 'drink') return buckets.drinks;
  if (category === 'dessert') return buckets.desserts;
  return buckets.extras;
}

function slugifyOptionName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function collectTacoPartsFromProduct(
  product: Product,
  buckets: StockBuckets,
  size: TacoSize
): void {
  const productAvailable = product.available !== false;
  for (const group of product.optionGroups) {
    const kind = classifyOptionGroup(group);
    if (kind === 'other') continue;
    const bucket = pickTacoPartBucket(kind, buckets);
    for (const option of group.options) {
      const available = option.available !== false && productAvailable;
      const price = option.extraPrice === 0 ? undefined : option.extraPrice;
      const code = slugifyOptionName(option.name);
      if (code === '') continue;
      const existing = bucket[code];
      // Accumulate the set of sizes that offer this option — sets differ per
      // size (e.g. the Bowl offers 4 meats, other sizes 10).
      const sizes = addSize(existing?.availableSizes, size);
      bucket[code] = existing
        ? { ...existing, in_stock: existing.in_stock || available, availableSizes: sizes }
        : {
            name: option.name,
            in_stock: available,
            price,
            // Taco option groups (meats / sauces / garnitures) don't carry
            // their own images on commande.app, and using the parent Tacos
            // image as a fallback was visually misleading — leave null so
            // the FE skips the avatar.
            imageUrl: null,
            availableSizes: sizes,
          };
    }
  }
}

/** Append `size` to an availability list, de-duplicated and order-stable. */
function addSize(existing: readonly TacoSize[] | undefined, size: TacoSize): readonly TacoSize[] {
  if (existing === undefined) return [size];
  if (existing.includes(size)) return existing;
  return [...existing, size];
}

function collectCategorizedProduct(product: Product, buckets: StockBuckets): void {
  const category = classifyProductCategory(product);
  // Crousty products are handled separately (getMenuSnapshot); `other` is noise.
  if (category === 'other' || category === 'crousty') return;
  const bucket = pickCategoryBucket(category, buckets);
  const code = slugifyOptionName(product.name);
  if (code === '') return;
  const available = product.available !== false;
  const existing = bucket[code];
  bucket[code] = existing
    ? { ...existing, in_stock: existing.in_stock || available }
    : {
        name: product.name,
        in_stock: available,
        price: product.price,
        imageUrl: product.imageUrl ?? null,
      };
}

/**
 * Resolve the app-domain reward category ('drinks' | 'desserts' | 'extras')
 * for combo side slots. We pick a product from each slot's commande.app
 * categoryId and run `classifyProductCategory` on its name. Returns the
 * majority vote, or `null` if no slot resolves to a known category.
 */
function inferRewardCategory(
  sideSlots: ReadonlyArray<{
    readonly productId: string | null;
    readonly categoryId: string | null;
  }>,
  products: ReadonlyArray<Product>,
  productCategoryById: ReadonlyMap<string, string | null>
): 'drinks' | 'desserts' | 'extras' | null {
  const tally = new Map<'drinks' | 'desserts' | 'extras', number>();
  for (const slot of sideSlots) {
    const sample = pickSlotSampleProduct(slot, products, productCategoryById);
    if (!sample) continue;
    const cat = classifyProductCategory(sample);
    if (cat === 'drink') tally.set('drinks', (tally.get('drinks') ?? 0) + 1);
    else if (cat === 'dessert') tally.set('desserts', (tally.get('desserts') ?? 0) + 1);
    else if (cat === 'extra') tally.set('extras', (tally.get('extras') ?? 0) + 1);
  }
  let best: 'drinks' | 'desserts' | 'extras' | null = null;
  let bestCount = 0;
  for (const [cat, count] of tally) {
    if (count > bestCount) {
      best = cat;
      bestCount = count;
    }
  }
  return best;
}

function pickSlotSampleProduct(
  slot: { readonly productId: string | null; readonly categoryId: string | null },
  products: ReadonlyArray<Product>,
  productCategoryById: ReadonlyMap<string, string | null>
): Product | undefined {
  if (slot.productId) return products.find((p) => p.id === slot.productId);
  if (slot.categoryId) {
    return products.find((p) => productCategoryById.get(p.id) === slot.categoryId);
  }
  return undefined;
}
