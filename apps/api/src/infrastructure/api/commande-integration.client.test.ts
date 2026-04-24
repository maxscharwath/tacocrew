/**
 * Tests for the commande integration client.
 *
 * Uses a hand-rolled stub in place of the real `CommandeClient` — we validate
 * that the adapter forwards calls with the right arguments and applies the
 * expected domain mapping, never that the underlying transport works.
 */

import { describe, expect, test as it, mock } from 'bun:test';
import type {
  ActivePreorder,
  CommandeClient,
  CreateOrderInput,
  CreateOrderResponse,
  DeliveryZone,
  OptionGroup,
  Order,
  OrderConfirmation,
  OrderStatusUpdate,
  PaymentMethodsResponse,
  Product,
  Restaurant,
  RestaurantStatus,
} from '@tacocrew/commande-client';
import { CommandeIntegrationClient } from '@/infrastructure/api/commande-integration.client';

const buildGroup = (
  overrides: Partial<OptionGroup> & Pick<OptionGroup, 'id' | 'name' | 'options'>
): OptionGroup => ({
  minSelection: 0,
  maxSelection: 10,
  ...overrides,
});

const buildProduct = (overrides: Partial<Product> & Pick<Product, 'id' | 'name'>): Product => ({
  price: 0,
  available: true,
  optionGroups: [],
  variants: [],
  ...overrides,
});

const TACO_L_PRODUCT: Product = buildProduct({
  id: 'prod-taco-l',
  name: 'Tacos L',
  price: 11,
  optionGroups: [
    buildGroup({
      id: 'grp-viande',
      name: 'Viande',
      options: [
        { id: 'opt-poulet', name: 'Poulet', extraPrice: 0 },
        { id: 'opt-steak', name: 'Steak', extraPrice: 0, available: false },
      ],
    }),
    buildGroup({
      id: 'grp-sauce',
      name: 'Sauce',
      options: [{ id: 'opt-ketchup', name: 'Ketchup', extraPrice: 0 }],
    }),
    buildGroup({
      id: 'grp-garniture',
      name: 'Garniture',
      options: [{ id: 'opt-cheddar', name: 'Cheddar', extraPrice: 0.5 }],
    }),
  ],
});

const DRINK_PRODUCT: Product = buildProduct({
  id: 'prod-coca',
  name: 'Coca-Cola',
  price: 3,
});

const DESSERT_PRODUCT: Product = buildProduct({
  id: 'prod-brownie',
  name: 'Brownie',
  price: 5,
  available: false,
});

const EXTRA_PRODUCT: Product = buildProduct({
  id: 'prod-frites',
  name: 'Frites',
  price: 4,
});

const NOISE_PRODUCT: Product = buildProduct({
  id: 'prod-unknown',
  name: 'Mystery item',
  price: 9,
});

const RESTAURANT: Restaurant = {
  id: 'r-1',
  slug: 'giga-tacos',
  name: 'Giga Tacos',
};

const RESTAURANT_STATUS: RestaurantStatus = {
  acceptingOrders: true,
  prepTimeMinutes: 15,
  prepTimeDelivery: 45,
  serviceType: 'full',
};

const DELIVERY_ZONE: DeliveryZone = {
  available: true,
  fee: 5,
  estimatedMinutes: 30,
  postalCode: '1004',
};

const PAYMENT_METHODS: PaymentMethodsResponse = {
  methods: ['twint', 'stripe'],
};

const ACTIVE_PREORDER: ActivePreorder = {
  orderId: 'ord-42',
  restaurantId: 'r-1',
  status: 'confirmed',
  serviceType: 'delivery',
  createdAt: '2026-04-24T12:00:00.000Z',
  items: [],
  totalAmount: 50,
};

const ORDER_CONFIRMATION: OrderConfirmation = {
  ...ACTIVE_PREORDER,
  status: 'preparing',
};

const CREATE_RESPONSE: CreateOrderResponse = {
  orderId: 'ord-42',
  transactionId: 'tx-1',
  total: 50,
  paymentMethod: 'twint',
};

const CREATE_INPUT: CreateOrderInput = {
  restaurantId: 'r-1',
  serviceType: 'delivery',
  items: [],
  total: 50,
  isPreorder: false,
  dineIn: false,
  isOnSite: false,
  deliveryFee: 5,
  customerName: 'Ada',
  customerPhone: '+41...',
  paymentMethod: 'twint',
};

const STATUS_UPDATE: OrderStatusUpdate = {
  orderId: 'ord-42',
  status: 'preparing',
  order: ORDER_CONFIRMATION,
  at: new Date('2026-04-24T12:05:00.000Z'),
};

type StubClient = {
  readonly restaurant: CommandeClient['restaurant'];
  readonly menu: CommandeClient['menu'];
  readonly order: CommandeClient['order'];
  readonly delivery: CommandeClient['delivery'];
  readonly payment: CommandeClient['payment'];
  readonly user: CommandeClient['user'];
  readonly tracking: CommandeClient['tracking'];
};

const buildStub = (
  overrides: {
    readonly products?: readonly Product[];
    readonly createResponse?: CreateOrderResponse;
    readonly confirmation?: Order;
    readonly preorders?: readonly ActivePreorder[];
    readonly status?: RestaurantStatus;
    readonly restaurant?: Restaurant;
    readonly zone?: DeliveryZone;
    readonly paymentMethods?: PaymentMethodsResponse;
    readonly pollUpdates?: readonly OrderStatusUpdate[];
  } = {}
): {
  readonly stub: StubClient;
  readonly mocks: {
    readonly getMenuItems: ReturnType<typeof mock>;
    readonly getBySlug: ReturnType<typeof mock>;
    readonly create: ReturnType<typeof mock>;
    readonly getOrderConfirmation: ReturnType<typeof mock>;
    readonly getActivePreorders: ReturnType<typeof mock>;
    readonly getRestaurantStatus: ReturnType<typeof mock>;
    readonly getZoneByPostalCode: ReturnType<typeof mock>;
    readonly getAvailableMethods: ReturnType<typeof mock>;
    readonly pollOrder: ReturnType<typeof mock>;
  };
} => {
  const products = overrides.products ?? [];
  const confirmation = overrides.confirmation ?? ORDER_CONFIRMATION;
  const preorders = overrides.preorders ?? [];
  const status = overrides.status ?? RESTAURANT_STATUS;
  const restaurant = overrides.restaurant ?? RESTAURANT;
  const zone = overrides.zone ?? DELIVERY_ZONE;
  const paymentMethods = overrides.paymentMethods ?? PAYMENT_METHODS;
  const createResponse = overrides.createResponse ?? CREATE_RESPONSE;
  const pollUpdates = overrides.pollUpdates ?? [STATUS_UPDATE];

  const getMenuItems = mock(async () => ({ products }));
  const getBySlug = mock(async () => restaurant);
  const create = mock(async () => createResponse);
  const getOrderConfirmation = mock(async () => confirmation);
  const getActivePreorders = mock(async () => preorders);
  const getRestaurantStatus = mock(async () => status);
  const getZoneByPostalCode = mock(async () => zone);
  const getAvailableMethods = mock(async () => paymentMethods);
  const pollOrder = mock(
    (): AsyncIterable<OrderStatusUpdate> => ({
      [Symbol.asyncIterator](): AsyncIterator<OrderStatusUpdate> {
        let index = 0;
        return {
          next(): Promise<IteratorResult<OrderStatusUpdate>> {
            const value = pollUpdates[index];
            if (value === undefined) {
              return Promise.resolve({ value: undefined, done: true });
            }
            index += 1;
            return Promise.resolve({ value, done: false });
          },
        };
      },
    })
  );

  const stub: StubClient = {
    restaurant: {
      getBySlug,
      getAllPublic: mock(async () => [restaurant]),
      getById: mock(async () => restaurant),
    } as unknown as CommandeClient['restaurant'],
    menu: {
      getMenuItems,
      getCombinations: mock(async () => []),
    } as unknown as CommandeClient['menu'],
    order: {
      create,
      getOrderConfirmation,
      getActivePreorders,
      getRestaurantStatus,
      potentialCreate: mock(async () => ({ valid: true, total: 0 })),
    } as unknown as CommandeClient['order'],
    delivery: {
      getZoneByPostalCode,
      getCityFromPostalCode: mock(async () => ({ city: '', postalCode: '' })),
      geocodeAddress: mock(async () => ({ latitude: 0, longitude: 0 })),
    } as unknown as CommandeClient['delivery'],
    payment: {
      getAvailableMethods,
    } as unknown as CommandeClient['payment'],
    user: {
      checkSmsRequirementPublic: mock(async () => ({ required: false })),
    } as unknown as CommandeClient['user'],
    tracking: { pollOrder } as unknown as CommandeClient['tracking'],
  };

  return {
    stub,
    mocks: {
      getMenuItems,
      getBySlug,
      create,
      getOrderConfirmation,
      getActivePreorders,
      getRestaurantStatus,
      getZoneByPostalCode,
      getAvailableMethods,
      pollOrder,
    },
  };
};

const makeClient = (overrides: Parameters<typeof buildStub>[0] = {}) => {
  const { stub, mocks } = buildStub(overrides);
  // Cast is acceptable at the test boundary — the stub implements the exact
  // shape `CommandeIntegrationClient` consumes, which is a strict subset of
  // `CommandeClient`. We reach for the structural contract, not nominal type.
  const client = new CommandeIntegrationClient(stub as unknown as CommandeClient);
  return { client, mocks };
};

describe('CommandeIntegrationClient', () => {
  describe('getMenu', () => {
    it('forwards restaurantId to menu.getMenuItems and returns the result', async () => {
      const { client, mocks } = makeClient({ products: [TACO_L_PRODUCT] });

      const result = await client.getMenu('r-1');

      expect(mocks.getMenuItems).toHaveBeenCalledTimes(1);
      expect(mocks.getMenuItems.mock.calls[0]?.[0]).toEqual({ restaurantId: 'r-1' });
      expect(result.products).toHaveLength(1);
      expect(result.products[0]?.id).toBe('prod-taco-l');
    });
  });

  describe('getStockForProcessing', () => {
    it('builds a StockAvailability from taco option groups and categorized products', async () => {
      const { client } = makeClient({
        products: [TACO_L_PRODUCT, DRINK_PRODUCT, DESSERT_PRODUCT, EXTRA_PRODUCT, NOISE_PRODUCT],
      });

      const stock = await client.getStockForProcessing('r-1');

      expect(Object.keys(stock.viandes).sort((a, b) => a.localeCompare(b))).toEqual([
        'poulet',
        'steak',
      ]);
      expect(stock.viandes['poulet']).toEqual({
        name: 'Poulet',
        in_stock: true,
        price: undefined,
        imageUrl: null,
      });
      expect(stock.viandes['steak']).toEqual({
        name: 'Steak',
        in_stock: false,
        price: undefined,
        imageUrl: null,
      });

      expect(stock.sauces).toEqual({
        ketchup: { name: 'Ketchup', in_stock: true, price: undefined, imageUrl: null },
      });
      expect(stock.garnitures).toEqual({
        cheddar: { name: 'Cheddar', in_stock: true, price: 0.5, imageUrl: null },
      });

      expect(stock.boissons).toEqual({
        coca_cola: { name: 'Coca-Cola', in_stock: true, price: 3, imageUrl: null },
      });
      expect(stock.desserts).toEqual({
        brownie: { name: 'Brownie', in_stock: false, price: 5, imageUrl: null },
      });
      expect(stock.extras).toEqual({
        frites: { name: 'Frites', in_stock: true, price: 4, imageUrl: null },
      });
    });
  });

  describe('getTacos', () => {
    it('maps only products that classify to a taco size', async () => {
      const { client } = makeClient({
        products: [TACO_L_PRODUCT, DRINK_PRODUCT, NOISE_PRODUCT],
      });

      const tacos = await client.getTacos('r-1');

      expect(tacos).toHaveLength(1);
      expect(tacos[0]?.id).toBe('prod-taco-l');
      expect(tacos[0]?.size).toBe('tacos_L');
    });
  });

  describe('submitOrder', () => {
    it('forwards the input to client.order.create and returns the response', async () => {
      const { client, mocks } = makeClient();

      const result = await client.submitOrder(CREATE_INPUT);

      expect(mocks.create).toHaveBeenCalledTimes(1);
      expect(mocks.create.mock.calls[0]?.[0]).toBe(CREATE_INPUT);
      expect(result).toEqual(CREATE_RESPONSE);
    });
  });

  describe('pollOrder', () => {
    it('yields status updates from the underlying poller', async () => {
      const { client, mocks } = makeClient({ pollUpdates: [STATUS_UPDATE] });

      const received: OrderStatusUpdate[] = [];
      for await (const update of client.pollOrder({ orderId: 'ord-42', restaurantId: 'r-1' })) {
        received.push(update);
      }

      expect(mocks.pollOrder).toHaveBeenCalledTimes(1);
      expect(mocks.pollOrder.mock.calls[0]?.[0]).toEqual({
        orderId: 'ord-42',
        restaurantId: 'r-1',
      });
      expect(received).toHaveLength(1);
      expect(received[0]?.status).toBe('preparing');
    });
  });

  describe('proxy methods', () => {
    it('getRestaurantStatus forwards restaurantId and optional serviceType', async () => {
      const { client, mocks } = makeClient();

      const status = await client.getRestaurantStatus('r-1', 'delivery');

      expect(mocks.getRestaurantStatus).toHaveBeenCalledTimes(1);
      expect(mocks.getRestaurantStatus.mock.calls[0]?.[0]).toEqual({
        restaurantId: 'r-1',
        serviceType: 'delivery',
      });
      expect(status).toEqual(RESTAURANT_STATUS);
    });

    it('getRestaurantStatus omits serviceType when not provided', async () => {
      const { client, mocks } = makeClient();

      await client.getRestaurantStatus('r-1');

      expect(mocks.getRestaurantStatus.mock.calls[0]?.[0]).toEqual({ restaurantId: 'r-1' });
    });

    it('getRestaurantBySlug forwards slug', async () => {
      const { client, mocks } = makeClient();

      const result = await client.getRestaurantBySlug('giga-tacos');

      expect(mocks.getBySlug).toHaveBeenCalledTimes(1);
      expect(mocks.getBySlug.mock.calls[0]?.[0]).toEqual({ slug: 'giga-tacos' });
      expect(result).toEqual(RESTAURANT);
    });

    it('getDeliveryZone forwards restaurantId + postalCode', async () => {
      const { client, mocks } = makeClient();

      const zone = await client.getDeliveryZone('r-1', '1004');

      expect(mocks.getZoneByPostalCode).toHaveBeenCalledTimes(1);
      expect(mocks.getZoneByPostalCode.mock.calls[0]?.[0]).toEqual({
        restaurantId: 'r-1',
        postalCode: '1004',
      });
      expect(zone).toEqual(DELIVERY_ZONE);
    });

    it('getAvailablePaymentMethods unwraps the methods array', async () => {
      const { client, mocks } = makeClient();

      const methods = await client.getAvailablePaymentMethods('r-1');

      expect(mocks.getAvailableMethods).toHaveBeenCalledTimes(1);
      expect(mocks.getAvailableMethods.mock.calls[0]?.[0]).toEqual({ restaurantId: 'r-1' });
      expect(methods).toEqual(['twint', 'stripe']);
    });

    it('getOrderConfirmation forwards orderId', async () => {
      const { client, mocks } = makeClient();

      const confirmation = await client.getOrderConfirmation('ord-42');

      expect(mocks.getOrderConfirmation).toHaveBeenCalledTimes(1);
      expect(mocks.getOrderConfirmation.mock.calls[0]?.[0]).toEqual({ orderId: 'ord-42' });
      expect(confirmation).toEqual(ORDER_CONFIRMATION);
    });

    it('getActivePreorders forwards restaurantId', async () => {
      const preorders = [ACTIVE_PREORDER];
      const { client, mocks } = makeClient({ preorders });

      const result = await client.getActivePreorders('r-1');

      expect(mocks.getActivePreorders).toHaveBeenCalledTimes(1);
      expect(mocks.getActivePreorders.mock.calls[0]?.[0]).toEqual({ restaurantId: 'r-1' });
      expect(result).toEqual(preorders);
    });
  });
});
