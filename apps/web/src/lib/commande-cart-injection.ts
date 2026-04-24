import type { OrderPreview, OrderPreviewItem, OrderPreviewOption } from '@/lib/api/types';

export interface CommandeCartSelectedOption {
  readonly groupId: string;
  readonly groupName: string;
  readonly itemId: string;
  readonly itemName: string;
  readonly quantity: number;
  readonly extraPrice: number;
  readonly groupOrder: number;
  readonly itemOrder: number;
}

/**
 * commande.app cart item shape, reverse-engineered from a real production
 * localStorage dump. Mandatory fields only — the SPA treats combination*,
 * variantId etc. as optional and hydrates defaults.
 */
export interface CommandeCartItem {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly productImage?: string | null;
  readonly selectedOptions: ReadonlyArray<CommandeCartSelectedOption>;
  readonly basePrice: number;
  readonly totalPrice: number;
  readonly quantity: number;
  readonly note: string;
  readonly serviceType: CommandeCartServiceType;
  readonly restaurantId: string;
  readonly restaurantName: string;
  readonly restaurantSlug: string;
}

/** Cart-side serviceType values (note `takeaway`, `dine_in`, differ from order.create). */
export type CommandeCartServiceType = 'takeaway' | 'delivery' | 'dine_in';

export interface CommandeCartStorage {
  readonly state: {
    readonly items: ReadonlyArray<CommandeCartItem>;
    readonly isOpen: false;
  };
  readonly version: 0;
}

export interface CommandeRestaurantMeta {
  readonly restaurantId: string;
  readonly restaurantName: string;
  readonly restaurantSlug: string;
  readonly restaurantLogoUrl?: string | null;
}

export const DEFAULT_COMMANDE_RESTAURANT_ID = 'cmmcc6j8a00056h175p38kx6l';
export const DEFAULT_COMMANDE_RESTAURANT_NAME = 'Giga Tacos Pontaise (Lausanne)';
export const DEFAULT_COMMANDE_RESTAURANT_SLUG = 'giga-tacos-pontaise-lausanne';
export const DEFAULT_COMMANDE_RESTAURANT_LOGO =
  'https://commande.app/uploads/restaurants/logo/1769545645-c324021cd96b4c21.jpg';

export function cartStorageKey(slug: string): string {
  return `platfo-cart-storage:${slug}`;
}

function randomCartItemId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function toCartServiceType(value: OrderPreview['serviceType']): CommandeCartServiceType {
  if (value === 'delivery') return 'delivery';
  if (value === 'dineIn') return 'dine_in';
  return 'takeaway';
}

function mapOption(
  option: OrderPreviewOption,
  groupOrder: number,
  itemOrder: number
): CommandeCartSelectedOption {
  return {
    groupId: option.groupId,
    groupName: option.groupName,
    itemId: option.itemId,
    itemName: option.itemName,
    quantity: option.quantity,
    extraPrice: option.extraPrice,
    groupOrder,
    itemOrder,
  };
}

function computeTotalPrice(item: OrderPreviewItem): number {
  const optionsPerUnit = item.options.reduce(
    (sum, option) => sum + option.extraPrice * option.quantity,
    0
  );
  return (item.price + optionsPerUnit) * item.quantity;
}

interface MapItemContext {
  readonly meta: CommandeRestaurantMeta;
  readonly serviceType: CommandeCartServiceType;
  /** Per-productId image map; the preview carries product images in `productImage`. */
  readonly productImages: Readonly<Record<string, string | null | undefined>>;
}

function mapItem(item: OrderPreviewItem, ctx: MapItemContext): CommandeCartItem {
  const productImage = item.productImage ?? ctx.productImages[item.productId] ?? null;
  // Group indices in commande.app's cart are stable per item; we assign sequentially
  // so groupOrder matches the order in which options appear.
  const seenGroups = new Map<string, number>();
  const selectedOptions = item.options.map((option, idx) => {
    let groupOrder = seenGroups.get(option.groupId);
    if (groupOrder === undefined) {
      groupOrder = seenGroups.size;
      seenGroups.set(option.groupId, groupOrder);
    }
    return mapOption(option, groupOrder, idx);
  });
  return {
    id: randomCartItemId(),
    productId: item.productId,
    productName: item.productName ?? 'Article',
    productImage,
    selectedOptions,
    basePrice: item.price,
    totalPrice: computeTotalPrice(item),
    quantity: item.quantity,
    note: item.note ?? '',
    serviceType: ctx.serviceType,
    restaurantId: ctx.meta.restaurantId,
    restaurantName: ctx.meta.restaurantName,
    restaurantSlug: ctx.meta.restaurantSlug,
  };
}

export interface BuildCartOptions {
  readonly serviceType?: CommandeCartServiceType;
  readonly productImages?: Readonly<Record<string, string | null | undefined>>;
}

export function buildCommandeCartPayload(
  orderPreview: OrderPreview,
  meta: CommandeRestaurantMeta,
  opts: BuildCartOptions = {}
): CommandeCartStorage {
  const serviceType = opts.serviceType ?? toCartServiceType(orderPreview.serviceType);
  const items = orderPreview.items.map((item) =>
    mapItem(item, { meta, serviceType, productImages: opts.productImages ?? {} })
  );
  return {
    state: { items, isOpen: false },
    version: 0,
  };
}

/** `restaurant-store` localStorage value — commande.app's active-restaurant context. */
export function buildRestaurantStorePayload(meta: CommandeRestaurantMeta): {
  readonly state: {
    readonly activeRestaurant: {
      readonly slug: string;
      readonly name: string;
      readonly logoUrl: string;
      readonly isLocked: false;
    };
    readonly isExplorerSession: true;
  };
  readonly version: 0;
} {
  return {
    state: {
      activeRestaurant: {
        slug: meta.restaurantSlug,
        name: meta.restaurantName,
        logoUrl: meta.restaurantLogoUrl ?? DEFAULT_COMMANDE_RESTAURANT_LOGO,
        isLocked: false,
      },
      isExplorerSession: true,
    },
    version: 0,
  };
}

/** `platfo-step-storage` value — resets the checkout wizard to the service step. */
export function buildStepStoragePayload(
  meta: CommandeRestaurantMeta,
  serviceType: CommandeCartServiceType
): {
  readonly state: {
    readonly selectedRestaurantId: string;
    readonly selectedRestaurantSlug: string;
    readonly step: 'service';
    readonly isMultiRestaurantMode: false;
    readonly selectedServiceType: CommandeCartServiceType;
    readonly deliveryAddress: null;
    readonly deliveryZone: null;
    readonly acceptedMinimum: false;
    readonly scheduledSlot: null;
  };
  readonly version: 0;
} {
  return {
    state: {
      selectedRestaurantId: meta.restaurantId,
      selectedRestaurantSlug: meta.restaurantSlug,
      step: 'service',
      isMultiRestaurantMode: false,
      selectedServiceType: serviceType,
      deliveryAddress: null,
      deliveryZone: null,
      acceptedMinimum: false,
      scheduledSlot: null,
    },
    version: 0,
  };
}

export function buildCommandeInjectionSnippet(
  cart: CommandeCartStorage,
  meta: CommandeRestaurantMeta,
  serviceType: CommandeCartServiceType
): string {
  const cartKey = cartStorageKey(meta.restaurantSlug);
  const restaurantStore = buildRestaurantStorePayload(meta);
  const stepStorage = buildStepStoragePayload(meta, serviceType);

  // Double-stringify so the inner JSON becomes a valid JS string literal inside
  // the snippet; otherwise unescaped quotes would break the pasted statement.
  const cartSerialized = JSON.stringify(JSON.stringify(cart));
  const restaurantSerialized = JSON.stringify(JSON.stringify(restaurantStore));
  const stepSerialized = JSON.stringify(JSON.stringify(stepStorage));
  const cartKeyLiteral = JSON.stringify(cartKey);

  return [
    '// tacocrew cart injection — paste in commande.app DevTools console',
    `localStorage.setItem("restaurant-store", ${restaurantSerialized});`,
    `localStorage.setItem("platfo-step-storage", ${stepSerialized});`,
    `localStorage.setItem(${cartKeyLiteral}, ${cartSerialized});`,
    `location.href = "https://commande.app/${meta.restaurantSlug}/checkout/";`,
  ].join('\n');
}