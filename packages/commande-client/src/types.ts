export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type ServiceType = 'delivery' | 'pickup' | 'dineIn';

export type PaymentMethod = 'twint' | 'stripe' | 'card' | 'cash';

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
};

export type OrderItem = {
  readonly productId: string;
  readonly productName?: string;
  readonly quantity: number;
  readonly price: number;
  readonly options: readonly OrderItemOption[];
  readonly variantId?: string | null;
  readonly note?: string | null;
};

export type CreateOrderInput = {
  readonly restaurantId: string;
  readonly serviceType: ServiceType;
  readonly items: readonly OrderItem[];
  readonly total: number;
  readonly isPreorder: boolean;
  readonly pickupTime?: string;
  readonly pickupEndTime?: string;
  readonly dineIn: boolean;
  readonly isOnSite: boolean;
  readonly deliveryFee: number;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly guestDeliveryAddress?: string | null;
  readonly paymentMethod: PaymentMethod;
  readonly stripePaymentIntentId?: string | null;
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
};

export type ActivePreorder = Order;

export type OrderConfirmation = Order;

export type PotentialOrderResult = {
  readonly success: boolean;
};

export type SmsRequirement = {
  readonly required: boolean;
  readonly newNumber?: boolean;
};

export type PaymentMethodsResponse = {
  readonly methods: readonly PaymentMethod[];
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

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export const SERVICE_TYPES: readonly ServiceType[] = ['delivery', 'pickup', 'dineIn'];

export const PAYMENT_METHODS: readonly PaymentMethod[] = ['twint', 'stripe', 'card', 'cash'];

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ['delivered', 'cancelled'];
