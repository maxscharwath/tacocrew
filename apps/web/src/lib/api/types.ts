import { TacoSize } from '@tacobot/gigatacos-client';
import type { DeliveryType } from '@/components/orders';

export interface LoginRequestBody {
  username: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    slackId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  name: string | null;
  slackId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryAddress {
  road: string;
  houseNumber?: string;
  postcode: string;
  city: string;
  state?: string;
  country?: string;
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
  leader: GroupLeader;
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
  price?: number;
  in_stock: boolean;
}

export interface TacoSizeItem {
  id: string;
  code: TacoSize;
  name: string;
  price: number;
  maxMeats: number;
  maxSauces: number;
  allowGarnitures: boolean;
}

export interface StockResponse {
  meats: StockItem[];
  sauces: StockItem[];
  garnishes: StockItem[];
  extras: StockItem[];
  drinks: StockItem[];
  desserts: StockItem[];
  tacos: TacoSizeItem[];
}

export interface GroupLeader {
  id: string;
  name: string | null;
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
}

export interface UpsertUserOrderBody {
  items: {
    tacos: TacoOrderInput[];
    extras: QuantitySelection[];
    drinks: QuantitySelection[];
    desserts: QuantitySelection[];
  };
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  price: number;
}

export interface TacoOrder extends MenuItem {
  size: TacoSize;
  meats: (MenuItem & { quantity: number })[];
  sauces: MenuItem[];
  garnitures: MenuItem[];
  note?: string;
  quantity: number;
  tacoID: string; // base58-encoded tacoID (Bitcoin-style identifier) - always required
}

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
}

export interface UserOrderSummary {
  id: string;
  groupOrderId: string;
  userId: string;
  name?: string | null;
  status: string;
  items: UserOrderItems;
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

export interface GroupOrderSubmissionResponse {
  groupOrderId: string;
  submittedCount: number;
  orderId: string;
  transactionId: string;
  dryRun?: boolean; // Present if order was submitted in dry-run mode
}
