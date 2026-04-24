/**
 * Tests for address formatter + BackendOrderSubmissionService dry-run.
 */

import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { OrderType, TacoSize } from '@/domain/taco-config';
import { CommandeIntegrationClient } from '@/infrastructure/api/commande-integration.client';
import { GarnitureId, MeatId, SauceId, TacoId, TacoKind } from '@/schemas/taco.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { UserOrderId } from '@/schemas/user-order.schema';
import { BackendOrderSubmissionService } from '@/services/order/backend-order-submission.service';
import { ResourceService } from '@/services/resource/resource.service';
import { SessionService } from '@/services/session/session.service';
import {
  type StructuredAddress,
  StockCategory,
  UserOrderStatus,
} from '@/shared/types/types';
import { formatAddressForBackend } from '@/shared/utils/address-formatter.utils';

describe('formatAddressForBackend', () => {
  it('should format address with all fields', () => {
    const address: StructuredAddress = {
      road: 'Rue de la Gare',
      house_number: '15',
      postcode: '1000',
      city: 'Lausanne',
      state: 'Vaud',
      country: 'Switzerland',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Rue de la Gare 15, 1000 Lausanne, Vaud, Switzerland');
  });

  it('should format address without house number', () => {
    const address: StructuredAddress = {
      road: 'Chemin du dessus',
      postcode: '1000',
      city: 'Lausanne',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Chemin du dessus, 1000 Lausanne');
  });

  it('should format address without optional fields (state, country)', () => {
    const address: StructuredAddress = {
      road: 'Rue Example',
      house_number: '42',
      postcode: '1000',
      city: 'Lausanne',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Rue Example 42, 1000 Lausanne');
  });

  it('should format address with only required fields', () => {
    const address: StructuredAddress = {
      road: 'Avenue Test',
      postcode: '2000',
      city: 'Neuchâtel',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Avenue Test, 2000 Neuchâtel');
  });

  it('should format address with state but no country', () => {
    const address: StructuredAddress = {
      road: 'Rue Test',
      house_number: '10',
      postcode: '1200',
      city: 'Genève',
      state: 'Genève',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Rue Test 10, 1200 Genève, Genève');
  });

  it('should format address with country but no state', () => {
    const address: StructuredAddress = {
      road: 'Boulevard Example',
      postcode: '3000',
      city: 'Bern',
      country: 'Switzerland',
    };

    const result = formatAddressForBackend(address);

    expect(result).toBe('Boulevard Example, 3000 Bern, Switzerland');
  });
});

describe('BackendOrderSubmissionService — dry-run end-to-end', () => {
  const sessionMock = {
    createSession: mock(async () => ({
      sessionId: '00000000-0000-0000-0000-000000000001',
      createdAt: new Date('2026-04-24T12:00:00Z'),
      lastActivityAt: new Date('2026-04-24T12:00:00Z'),
      metadata: null,
    })),
  };

  const resourceMock = {
    getStockForProcessing: mock(async () => ({
      [StockCategory.Meats]: [],
      [StockCategory.Sauces]: [],
      [StockCategory.Garnishes]: [],
      [StockCategory.Extras]: [],
      [StockCategory.Drinks]: [],
      [StockCategory.Desserts]: [],
      tacos: [],
    })),
  };

  // Realistic menu modelled after commande.app — only the fields the service
  // actually reads. Product IDs are fake CUIDs, option IDs are fake CUIDs.
  const fakeMenu = {
    products: [
      {
        id: 'prod-tacos-l',
        name: 'Tacos L',
        description: null,
        price: 11,
        imageUrl: null,
        available: true,
        categoryId: 'cat-tacos',
        categoryName: 'Tacos',
        optionGroups: [
          {
            id: 'grp-viande',
            name: 'Viande',
            minSelection: 1,
            maxSelection: 1,
            options: [
              { id: 'opt-viande-hachee', name: 'Viande hachée (boeuf)', extraPrice: 0, available: true },
            ],
          },
          {
            id: 'grp-sauce',
            name: 'Sauce',
            minSelection: 1,
            maxSelection: 3,
            options: [{ id: 'opt-harissa', name: 'Harissa', extraPrice: 0, available: true }],
          },
          {
            id: 'grp-garniture',
            name: 'Garnitures',
            minSelection: 0,
            maxSelection: 3,
            options: [{ id: 'opt-frites', name: 'Frites', extraPrice: 0, available: true }],
          },
        ],
        variants: [],
      },
      {
        id: 'prod-extra-frites',
        name: 'Portion de frites',
        description: null,
        price: 5,
        imageUrl: null,
        available: true,
        categoryId: 'cat-extras',
        categoryName: 'Extras',
        optionGroups: [],
        variants: [],
      },
      {
        id: 'prod-coca',
        name: 'Coca-Cola 33cl',
        description: null,
        price: 3,
        imageUrl: null,
        available: true,
        categoryId: 'cat-boissons',
        categoryName: 'Boissons',
        optionGroups: [],
        variants: [],
      },
      {
        id: 'prod-brownie',
        name: 'Brownie',
        description: null,
        price: 4.5,
        imageUrl: null,
        available: true,
        categoryId: 'cat-desserts',
        categoryName: 'Desserts',
        optionGroups: [],
        variants: [],
      },
    ],
  };

  const commandeMock = {
    submitOrder: mock(async () => ({ orderId: 'should-not-be-called' })),
    getOrderConfirmation: mock(async () => ({ orderId: 'n/a' })),
    getActivePreorders: mock(async () => []),
    getMenu: mock(async () => fakeMenu),
    preflightOrder: mock(async () => ({
      ok: true,
      restaurantStatus: { acceptingOrders: true },
      deliveryZone: { available: true, fee: 2, postalCode: '1000' },
      issues: [],
    })),
  };

  beforeEach(() => {
    container.clearInstances();
    sessionMock.createSession.mockClear();
    resourceMock.getStockForProcessing.mockClear();
    commandeMock.submitOrder.mockClear();

    container.registerInstance(SessionService, sessionMock as unknown as SessionService);
    container.registerInstance(ResourceService, resourceMock as unknown as ResourceService);
    container.registerInstance(
      CommandeIntegrationClient,
      commandeMock as unknown as CommandeIntegrationClient
    );
  });

  const meat = {
    id: MeatId.parse('10000000-1000-4000-8000-100000000010'),
    code: 'viande_hachee_boeuf',
    name: 'Viande hachée (boeuf)',
    quantity: 1,
  };
  const sauce = {
    id: SauceId.parse('10000000-1000-4000-8000-100000000020'),
    code: 'harissa',
    name: 'Harissa',
  };
  const garniture = {
    id: GarnitureId.parse('10000000-1000-4000-8000-100000000030'),
    code: 'frites',
    name: 'Frites',
  };

  const userOrder = {
    id: UserOrderId.parse('10000000-1000-4000-8000-100000000100'),
    groupOrderId: '10000000-1000-4000-8000-100000000200' as UserOrder['groupOrderId'],
    userId: '10000000-1000-4000-8000-100000000300' as UserOrder['userId'],
    username: 'alice',
    status: UserOrderStatus.DRAFT,
    items: {
      tacos: [
        {
          id: TacoId.parse('10000000-1000-4000-8000-100000001000'),
          kind: TacoKind.REGULAR as const,
          size: TacoSize.L,
          meats: [meat],
          sauces: [sauce],
          garnitures: [garniture],
          price: 11,
          tacoID: 'abc123',
        },
      ],
      extras: [
        {
          id: '10000000-1000-4000-8000-100000002000' as UserOrder['items']['extras'][number]['id'],
          code: 'portion_de_frites',
          name: 'Portion de frites',
          price: 5,
          quantity: 1,
        },
      ],
      drinks: [
        {
          id: '10000000-1000-4000-8000-100000003000' as UserOrder['items']['drinks'][number]['id'],
          code: 'coca_cola_33cl',
          name: 'Coca-Cola 33cl',
          price: 3,
          quantity: 2,
        },
      ],
      desserts: [
        {
          id: '10000000-1000-4000-8000-100000004000' as UserOrder['items']['desserts'][number]['id'],
          code: 'brownie',
          name: 'Brownie',
          price: 4.5,
          quantity: 1,
        },
      ],
    },
    createdAt: new Date('2026-04-24T11:00:00Z'),
    updatedAt: new Date('2026-04-24T11:00:00Z'),
  } satisfies UserOrder;

  const customer = { name: 'Alice Test', phone: '+41 21 000 00 00' };

  const deliveryAddress = {
    road: 'Rue Test',
    house_number: '1',
    postcode: '1000',
    city: 'Lausanne',
  } satisfies StructuredAddress;

  it('returns a dry-run result with orderPreview and never calls commande.submitOrder', async () => {
    const service = container.resolve(BackendOrderSubmissionService);

    const result = await service.submitGroupOrder({
      userOrders: [userOrder],
      customer,
      delivery: {
        type: OrderType.DELIVERY,
        address: deliveryAddress,
        requestedFor: { start: new Date(), end: new Date() },
      },
      paymentMethod: 'twint',
      dryRun: true,
    });

    expect(commandeMock.submitOrder).not.toHaveBeenCalled();
    expect(result.dryRun).toBe(true);
    expect(result.orderId.startsWith('dry-run-')).toBe(true);
    expect(result.backendTotal).toBeNull();
    expect(result.computedTotal).toBeGreaterThan(0);

    const preview = result.orderPreview;
    if (!preview) throw new Error('expected orderPreview');

    expect(preview.serviceType).toBe('delivery');
    expect(preview.paymentMethod).toBe('twint');
    expect(preview.guestDeliveryAddress).toBe('Rue Test 1, 1000 Lausanne');
    expect(preview.customerName).toBe('Alice Test');
    expect(preview.isPreorder).toBe(true);
    expect(preview.dineIn).toBe(false);

    expect(preview.items).toHaveLength(4);

    const taco = preview.items[0];
    if (!taco) throw new Error('missing taco item');
    expect(taco.productId).toBe('prod-tacos-l');
    expect(taco.price).toBe(11);
    expect(taco.options).toHaveLength(3);
    expect(taco.options?.[0]).toEqual({
      groupId: 'grp-viande',
      groupName: 'Viande',
      itemId: 'opt-viande-hachee',
      itemName: 'Viande hachée (boeuf)',
      quantity: 1,
      extraPrice: 0,
    });
    expect(taco.options?.[1]?.groupId).toBe('grp-sauce');
    expect(taco.options?.[1]?.itemId).toBe('opt-harissa');
    expect(taco.options?.[2]?.groupId).toBe('grp-garniture');
    expect(taco.options?.[2]?.itemId).toBe('opt-frites');

    expect(preview.items[1]?.productId).toBe('prod-extra-frites');
    expect(preview.items[2]?.productId).toBe('prod-coca');
    expect(preview.items[2]?.quantity).toBe(2);
    expect(preview.items[3]?.productId).toBe('prod-brownie');

    expect(result.preflight?.ok).toBe(true);
    expect(result.preflight?.deliveryZone?.fee).toBe(2);
  });

  it('maps emporter → pickup and nulls the guest delivery address', async () => {
    const service = container.resolve(BackendOrderSubmissionService);

    const result = await service.submitGroupOrder({
      userOrders: [userOrder],
      customer,
      delivery: {
        type: OrderType.TAKEAWAY,
        address: deliveryAddress,
        requestedFor: { start: new Date(), end: new Date() },
      },
      paymentMethod: 'especes',
      dryRun: true,
    });

    expect(result.orderPreview?.serviceType).toBe('pickup');
    expect(result.orderPreview?.guestDeliveryAddress).toBeNull();
    expect(result.orderPreview?.paymentMethod).toBe('cash');
  });
});
