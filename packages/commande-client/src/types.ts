/**
 * Statuses observed on the commande.app wire: pending, confirmed, printed
 * (kitchen ticket), delivering, delivered, cancelled — all seen in production
 * captures. `preparing`/`ready` have never been observed and are kept only as
 * tolerated values. The `(string & {})` arm keeps the union open: commande.app
 * can introduce new statuses at any time and parsing must not break —
 * consumers should treat unknown values as "in progress".
 */
export type KnownOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'printed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type OrderStatus = KnownOrderStatus | (string & {});

/**
 * Values proven from the commande.app frontend bundle (2026-07 HAR):
 * `"takeaway"===t?"takeaway":"delivery"===t?"delivery":"dine_in"`.
 * There is no "pickup" — takeaway orders must be sent as `takeaway`.
 */
export type KnownServiceType = 'delivery' | 'takeaway' | 'dine_in';
export type ServiceType = KnownServiceType | (string & {});

export type KnownPaymentMethod = 'twint' | 'stripe' | 'card' | 'cash';
export type PaymentMethod = KnownPaymentMethod | (string & {});

export type BusyLevel = 'low' | 'medium' | 'high';

export type Option = {
  readonly id: string;
  readonly name: string;
  readonly extraPrice: number;
  readonly available?: boolean;
};

export type OptionGroup = {
  readonly id: string;
  readonly name: string;
  readonly minSelection: number;
  readonly maxSelection: number;
  readonly options: readonly Option[];
};

export type Variant = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly available?: boolean;
};

export type Product = {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly price: number;
  readonly imageUrl?: string | null;
  readonly available: boolean;
  readonly categoryId?: string | null;
  /** commande.app category display name (e.g. "Tacos", "Boissons"). The most
   * reliable classification signal — product names alone are unreliable. */
  readonly categoryName?: string | null;
  readonly optionGroups: readonly OptionGroup[];
  readonly variants: readonly Variant[];
};

export type CombinationItem = {
  readonly id: string;
  readonly combinationId: string;
  readonly productId: string | null;
  readonly categoryId: string | null;
  readonly quantity: number;
  readonly isMainProduct: boolean;
  readonly excludedProductIds: readonly string[];
};

export type Combination = {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly price: number;
  readonly image?: string | null;
  readonly isActive: boolean;
  readonly displayOrder?: number | null;
  readonly serviceTypes: readonly string[];
  readonly items: readonly CombinationItem[];
};

export type Restaurant = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly address?: string | null;
  readonly phone?: string | null;
  readonly city?: string | null;
  readonly postalCode?: string | null;
  readonly countryCode?: string | null;
};

export type RestaurantStatus = {
  readonly id?: string;
  readonly name?: string;
  readonly acceptingOrders: boolean;
  readonly prepTimeMinutes?: number | null;
  readonly prepTimeDelivery?: number | null;
  readonly minPreorderMinutes?: number | null;
  readonly serviceType?: string | null;
  readonly isDemo?: boolean | null;
};

export type DeliveryZone = {
  readonly available: boolean;
  readonly fee: number;
  readonly estimatedMinutes?: number | null;
  readonly postalCode: string;
  readonly minOrderAmount?: number | null;
  /** 'accept' lets the customer accept a below-minimum order; 'block' refuses it. */
  readonly minOrderMode?: string | null;
  readonly closureMessage?: string | null;
};

export type GeocodeResult = {
  readonly latitude: number;
  readonly longitude: number;
  readonly formattedAddress?: string | null;
};

export type OrderItemOption = {
  readonly groupId: string;
  readonly groupName: string;
  readonly itemId: string;
  readonly itemName: string;
  readonly quantity: number;
  readonly extraPrice: number;
  /** Display ordering — the commande.app web client always sends 0. */
  readonly groupOrder?: number;
  readonly itemOrder?: number;
};

export type OrderItem = {
  readonly productId: string;
  readonly productName?: string | null;
  readonly quantity: number;
  readonly price: number;
  readonly options: readonly OrderItemOption[];
  readonly variantId?: string | null;
  readonly note?: string | null;
  readonly combinationId?: string | null;
  readonly combinationInstanceId?: string | null;
};

export type CreateOrderInput = {
  readonly restaurantId: string;
  readonly serviceType: ServiceType;
  readonly items: readonly OrderItem[];
  readonly total: number;
  readonly isPreorder: boolean;
  /** Pass a Date — the envelope encoder forwards it as a superjson Date so commande.app's `z.date()` accepts it. */
  readonly pickupTime?: Date;
  readonly pickupEndTime?: Date;
  readonly dineIn: boolean;
  readonly isOnSite: boolean;
  readonly deliveryFee: number;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly guestDeliveryAddress?: string | null;
  readonly paymentMethod: PaymentMethod;
  readonly stripePaymentIntentId?: string | null;
  // Fields the commande.app web client always includes — optional here so
  // legacy callers keep compiling, but submission should send them.
  readonly addressId?: string | null;
  readonly deliveryNote?: string;
  readonly deliveryNotes?: string;
  /** Customer acknowledged being below the delivery minimum (minOrderMode 'accept'). */
  readonly acceptedMinimum?: boolean;
};

export type CreateOrderResponse = {
  readonly orderId: string;
  readonly transactionId?: string | null;
  readonly total?: number;
  readonly paymentMethod?: PaymentMethod;
};

export type Order = {
  readonly orderId: string;
  readonly restaurantId: string;
  readonly status: OrderStatus;
  readonly serviceType: ServiceType;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly items: readonly OrderItem[];
  readonly totalAmount: number;
  readonly deliveryFee?: number;
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly guestDeliveryAddress?: string | null;
  readonly paymentMethod?: PaymentMethod;
  readonly pickupTime?: string | null;
  readonly pickupEndTime?: string | null;
  readonly eta?: string | null;
  readonly estimatedMinutes?: number | null;
  readonly isPaid?: boolean;
  readonly cancellationReason?: string | null;
  /** Status → ISO timestamp of when the order entered that status. */
  readonly statusTimestamps?: Readonly<Record<string, string>>;
};

export type ActivePreorder = Order;

export type OrderConfirmation = Order;

export type PotentialOrderResult = {
  readonly success: boolean;
};

export type SmsRequirement = {
  readonly required: boolean;
  readonly alreadyVerified?: boolean;
};

export type PaymentMethodsResponse = {
  readonly methods: readonly PaymentMethod[];
  readonly stripeEnabled: boolean;
  readonly twintOnlineEnabled: boolean;
  readonly cashEnabled: boolean;
  readonly posEnabled: boolean;
};

export type OrderStatusUpdate = {
  readonly orderId: string;
  readonly status: OrderStatus;
  readonly order?: ActivePreorder;
  readonly at: Date;
};

export type LogMeta = Readonly<Record<string, unknown>>;

export type Logger = {
  debug(msg: string, meta?: LogMeta): void;
  info(msg: string, meta?: LogMeta): void;
  warn(msg: string, meta?: LogMeta): void;
  error(msg: string, meta?: LogMeta): void;
};

export const ORDER_STATUSES: readonly KnownOrderStatus[] = [
  'pending',
  'confirmed',
  'printed',
  'preparing',
  'ready',
  'delivering',
  'delivered',
  'completed',
  'cancelled',
];

export const SERVICE_TYPES: readonly KnownServiceType[] = ['delivery', 'takeaway', 'dine_in'];

export const PAYMENT_METHODS: readonly KnownPaymentMethod[] = [
  'twint',
  'stripe',
  'card',
  'cash',
];

// `completed` is the observed terminal status; `delivered` kept as tolerated.
export const TERMINAL_ORDER_STATUSES: readonly KnownOrderStatus[] = [
  'completed',
  'delivered',
  'cancelled',
];
