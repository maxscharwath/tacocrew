import type { DeliveryType } from '@/components/orders';
import type { SwissCanton } from '@/constants/location.ts';
import type { TacoSize } from '@/lib/taco-config';

/**
 * Currency namespace with common ISO 4217 currency codes
 * Use Currency.CHF, Currency.EUR, etc. for type-safe currency access
 */
export const Currency = {
  CHF: 'CHF', // Swiss Franc
  EUR: 'EUR', // Euro
  USD: 'USD', // US Dollar
  GBP: 'GBP', // British Pound
  JPY: 'JPY', // Japanese Yen
  CAD: 'CAD', // Canadian Dollar
  AUD: 'AUD', // Australian Dollar
  CNY: 'CNY', // Chinese Yuan
} as const;

/**
 * Common currency codes from the Currency namespace
 */
export type CommonCurrency = (typeof Currency)[keyof typeof Currency];

/**
 * Currency type that allows common currencies with autocomplete
 * while also accepting any valid ISO 4217 currency code string
 */
export type CurrencyCode = CommonCurrency | string;

/**
 * Represents a monetary amount with currency
 */
export interface Amount {
  /** The monetary value */
  readonly value: number;
  /** The currency code (ISO 4217) */
  readonly currency: CurrencyCode;
}

/**
 * Creates an Amount object
 */
export function createAmount(value: number, currency: CurrencyCode = Currency.CHF): Amount {
  return { value, currency };
}

export interface LoginRequestBody {
  username: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    createdAt?: string;
    updatedAt?: string;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  name: string | null;
  phone?: string | null;
  language?: string | null;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  image?: string | null;
  hasSlackWebhook?: boolean;
  slackWebhookUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  role?: OrganizationRole;
  status?: OrganizationMemberStatus;
}

export interface OrganizationPayload {
  name: string;
}

export type OrganizationRole = 'ADMIN' | 'MEMBER';
export type OrganizationMemberStatus = 'PENDING' | 'ACTIVE';

export interface OrganizationMember {
  userId: string;
  role: OrganizationRole;
  status: OrganizationMemberStatus;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    username: string | null;
  };
  createdAt: string;
}

export interface PendingRequest {
  userId: string;
  role: OrganizationRole;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    username: string | null;
  };
  createdAt: string;
}

export interface DeliveryAddress {
  road: string;
  houseNumber?: string;
  postcode: string;
  city: string;
  state: SwissCanton;
  country: string;
}

export interface DeliveryProfile {
  id: string;
  label: string | null;
  contactName: string;
  phone: string;
  deliveryType: DeliveryType;
  address: DeliveryAddress;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryProfilePayload {
  label?: string;
  contactName: string;
  phone: string;
  deliveryType: DeliveryType;
  address: DeliveryAddress;
}

export interface UserGroupOrder {
  id: string;
  name: string | null;
  status: string;
  canAcceptOrders: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  leader: GroupLeader;
  participants: Array<{
    id: string;
    name: string | null;
  }>;
}

export interface UserOrderHistoryEntry {
  id: string;
  orderId: string;
  status: string;
  price: number | null;
  orderType: string;
  requestedFor: string;
  createdAt: string;
}

export interface PreviousOrder {
  tacoID: string; // base58-encoded tacoID (Bitcoin-style identifier)
  orderCount: number;
  lastOrderedAt: string;
  taco: TacoOrder; // Single taco with this tacoID
  recentGroupOrderName?: string | null;
}

export interface StockItem {
  id: string;
  code: string;
  name: string;
  price?: Amount;
  in_stock: boolean;
  // Absolute product image URL from commande.app (not present for taco sizes).
  imageUrl?: string | null;
  // For meats/sauces/garnishes: the taco size codes that offer this option.
  // Omitted for size-agnostic items. When present, only offer it for these
  // sizes (option sets differ per size — e.g. the Bowl offers only 4 meats).
  availableSizes?: TacoSize[];
}

export interface TacoSizeItem {
  id: string;
  code: TacoSize;
  name: string;
  price: Amount;
  maxMeats: number;
  maxSauces: number;
  allowGarnitures: boolean;
}

export type CroustyVariant = 'sweet' | 'spicy' | 'custom' | 'other';

export interface CroustyOption {
  id: string;
  name: string;
  price?: Amount;
  in_stock: boolean;
}

export interface CroustyOptionGroup {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  options: CroustyOption[];
}

/** A Tasty Crousty product with its full option structure (from GET /stock). */
export interface CroustyProduct {
  id: string;
  code: string;
  name: string;
  price: Amount;
  imageUrl?: string | null;
  in_stock: boolean;
  variant: CroustyVariant;
  optionGroups: CroustyOptionGroup[];
}

/** A chosen option within a Crousty group, keyed by group + option name. */
export interface CroustyOptionSelection {
  groupName: string;
  optionName: string;
}

/** Request shape for a Crousty line when creating/updating a user order. */
export interface CroustyOrderInput {
  code: string;
  options: CroustyOptionSelection[];
  quantity?: number;
}

/** Persisted Crousty line as returned by the API. */
export interface CroustyOrder {
  id: string;
  code: string;
  name: string;
  variant: Exclude<CroustyVariant, 'other'>;
  price: Amount;
  quantity: number;
  options: CroustyOptionSelection[];
}

export type PromoCategory = 'drinks' | 'desserts' | 'extras';

export interface PromoTrigger {
  readonly quantity: number;
  readonly tacoSizes?: ReadonlyArray<TacoSize>;
}

export interface PromoReward {
  readonly quantity: number;
  readonly category: PromoCategory;
  readonly excludedCodes: ReadonlyArray<string>;
}

/**
 * Generic promotion descriptor. Today only `kind: 'free-item'` exists. Future
 * variants (percent / fixed-amount discount) extend the union by adding more
 * `kind` literals.
 */
export interface FreeItemPromo {
  readonly kind: 'free-item';
  readonly id: string;
  readonly name: string;
  readonly serviceTypes: ReadonlyArray<string>;
  readonly trigger: PromoTrigger;
  readonly reward: PromoReward;
}

export type Promo = FreeItemPromo;

export interface StockResponse {
  meats: StockItem[];
  sauces: StockItem[];
  garnishes: StockItem[];
  extras: StockItem[];
  drinks: StockItem[];
  desserts: StockItem[];
  tacos: TacoSizeItem[];
  crousties: CroustyProduct[];
  promos: Promo[];
}

export interface GroupLeader {
  id: string;
  name: string | null;
  phone?: string | null;
  image?: string | null;
}

export interface GroupOrder {
  id: string;
  leader: GroupLeader;
  name: string | null;
  startDate: string;
  endDate: string;
  status: string;
  canAcceptOrders: boolean;
  canSubmitGroupOrder: boolean;
  fee?: number | null;
  organizationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TacoMeatSelection {
  id: string;
  quantity: number;
}

export interface SimpleSelection {
  id: string;
}

export interface QuantitySelection {
  id: string;
  quantity: number;
}

export interface TacoOrderInput {
  size: TacoSize;
  meats: TacoMeatSelection[];
  sauces: SimpleSelection[];
  garnitures: SimpleSelection[];
  note?: string;
  quantity?: number;
  kind?: TacoKind;
}

export interface UpsertUserOrderBody {
  items: {
    tacos: TacoOrderInput[];
    extras: QuantitySelection[];
    drinks: QuantitySelection[];
    desserts: QuantitySelection[];
    crousties?: CroustyOrderInput[];
  };
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  price: Amount;
}

export enum TacoKind {
  REGULAR = 'regular',
  MYSTERY = 'mystery',
}

export interface RegularTacoOrder extends MenuItem {
  size: TacoSize;
  meats: (MenuItem & { quantity: number })[];
  sauces: MenuItem[];
  garnitures: MenuItem[];
  note?: string;
  quantity: number;
  tacoID: string; // base58-encoded tacoID (Bitcoin-style identifier) - required for regular tacos
  kind: TacoKind.REGULAR;
}

export interface MysteryTacoOrder extends MenuItem {
  size: TacoSize;
  meats: (MenuItem & { quantity: number })[];
  sauces: MenuItem[];
  garnitures: MenuItem[];
  note?: string;
  quantity: number;
  tacoID?: string; // Mystery tacos may not have a tacoID
  kind: TacoKind.MYSTERY;
}

export type TacoOrder = RegularTacoOrder | MysteryTacoOrder;

export interface PricedSelection extends MenuItem {
  quantity: number;
  free_sauce?: MenuItem;
  free_sauces?: MenuItem[];
}

export interface UserOrderItems {
  tacos: TacoOrder[];
  extras: PricedSelection[];
  drinks: PricedSelection[];
  desserts: PricedSelection[];
  crousties?: CroustyOrder[];
}

export interface PaymentMarker {
  id: string;
  name?: string | null;
}

export interface ReimbursementStatus {
  settled: boolean;
  settledAt?: string | null;
  settledBy?: PaymentMarker | null;
}

export interface ParticipantPaymentStatus {
  paid: boolean;
  paidAt?: string | null;
  paidBy?: PaymentMarker | null;
}

export interface UserOrderSummary {
  id: string;
  groupOrderId: string;
  userId: string;
  name?: string | null;
  status: string;
  items: UserOrderItems;
  totalPrice: Amount;
  reimbursement: ReimbursementStatus;
  participantPayment: ParticipantPaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GroupOrderWithUserOrders {
  groupOrder: GroupOrder;
  userOrders: UserOrderSummary[];
}

export interface UserOrderResponse extends UserOrderSummary {}

export interface UserOrderDetail extends UserOrderSummary {}

export interface CreateGroupOrderBody {
  name?: string;
  startDate: string;
  endDate: string;
  organizationId?: string;
}

export type PaymentMethod = 'especes' | 'carte' | 'twint';

export interface GroupOrderSubmissionBody {
  customer: {
    name: string;
    phone: string;
  };
  delivery: {
    type: 'livraison' | 'emporter';
    address: {
      road: string;
      house_number?: string;
      postcode: string;
      city: string;
      state?: string;
      country?: string;
    };
    requestedFor: string;
  };
  paymentMethod: PaymentMethod;
  dryRun?: boolean; // If true, skips actual submission to RocknRoll.php but creates session and cart
}

export interface OrderSummaryItem {
  tacos: Array<{
    quantity: number;
    size: string;
    price: number;
    meats: string;
    garnitures: string;
    sauces: string;
  }>;
  extras: Array<{
    quantity: number;
    name: string;
    price: number;
  }>;
  drinks: Array<{
    quantity: number;
    name: string;
    price: number;
  }>;
  desserts: Array<{
    quantity: number;
    name: string;
    price: number;
  }>;
}

export interface OrderSummary {
  cartTotal: number;
  deliveryFee: number;
  totalAmount: number;
  items: OrderSummaryItem;
}

export interface OrderPreviewOption {
  readonly groupId: string;
  readonly groupName: string;
  readonly itemId: string;
  readonly itemName: string;
  readonly quantity: number;
  readonly extraPrice: number;
}

export interface OrderPreviewCombo {
  readonly combinationId: string;
  readonly combinationName: string;
  readonly combinationPrice: number;
  readonly combinationInstanceId: string;
  readonly combinationServiceTypes: ReadonlyArray<string>;
  readonly isMainInCombination: boolean;
}

export interface OrderPreviewItem {
  readonly productId: string;
  readonly productName?: string;
  readonly productImage?: string | null;
  readonly variantId?: string | null;
  readonly quantity: number;
  readonly price: number;
  readonly options: ReadonlyArray<OrderPreviewOption>;
  readonly note?: string | null;
  readonly combo?: OrderPreviewCombo;
}

export interface OrderPreview {
  readonly restaurantId: string;
  readonly serviceType: 'delivery' | 'pickup' | 'dineIn';
  readonly items: ReadonlyArray<OrderPreviewItem>;
  readonly total: number;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly guestDeliveryAddress?: string | null;
  readonly paymentMethod: string;
  readonly isPreorder: boolean;
  readonly dineIn: boolean;
  readonly isOnSite: boolean;
  readonly deliveryFee: number;
}

export interface OrderPreflight {
  readonly ok: boolean;
  readonly restaurantStatus?: unknown;
  readonly deliveryZone?: unknown;
  readonly issues: ReadonlyArray<string>;
}

export interface GroupOrderSubmissionResponse {
  groupOrderId: string;
  submittedCount: number;
  orderId: string;
  transactionId: string;
  dryRun?: boolean; // Present if order was submitted in dry-run mode
  // Populated when the backend has an orderPreview from commande.app.
  orderPreview?: OrderPreview;
  preflight?: OrderPreflight;
}

// Badge types have been moved to their respective modules:
// - @/config/badges.config: BadgeDefinition, BadgeTier, BadgeCategory
// - @/lib/api/badges: EarnedBadgeResponse, BadgeProgress, BadgeStatsResponse, UserBadgeContext
// - @/hooks/useBadges: UserBadge, BadgeStats
