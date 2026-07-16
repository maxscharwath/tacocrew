import { describe, expect, test } from 'bun:test';
import type { OrderPreview } from '@/lib/api/types';
import {
  buildCommandeCartPayload,
  buildCommandeInjectionSnippet,
  type CommandeRestaurantMeta,
  cartStorageKey,
} from '@/lib/commande-cart-injection';

const META: CommandeRestaurantMeta = {
  restaurantId: 'restaurant-cuid',
  restaurantName: 'Giga Tacos Pontaise (Lausanne)',
  restaurantSlug: 'giga-tacos-pontaise-lausanne',
};

function previewWithTaco(): OrderPreview {
  return {
    restaurantId: META.restaurantId,
    serviceType: 'takeaway',
    items: [
      {
        productId: 'product-cuid',
        productName: 'Taco M',
        productImage: 'https://commande.app/uploads/products/img.jpg',
        variantId: null,
        quantity: 2,
        price: 10,
        options: [
          {
            groupId: 'group-cuid',
            groupName: 'Viandes',
            itemId: 'item-cuid',
            itemName: 'Poulet',
            quantity: 1,
            extraPrice: 1.5,
          },
        ],
        note: 'no onions',
      },
    ],
    total: 23,
    customerName: 'Alice',
    customerPhone: '+41000',
    guestDeliveryAddress: null,
    paymentMethod: 'twint',
    isPreorder: false,
    dineIn: false,
    isOnSite: false,
    deliveryFee: 0,
  };
}

describe('buildCommandeCartPayload', () => {
  test('wraps items into the zustand persist envelope', () => {
    const payload = buildCommandeCartPayload(previewWithTaco(), META);

    expect(payload.version).toBe(0);
    expect(payload.state.isOpen).toBe(true);
    expect(payload.state.items).toHaveLength(1);
  });

  test('computes totalPrice from basePrice + option extras * quantity', () => {
    const payload = buildCommandeCartPayload(previewWithTaco(), META);
    const [item] = payload.state.items;

    // (10 + 1.5 * 1) * 2 = 23
    expect(item?.totalPrice).toBe(23);
    expect(item?.basePrice).toBe(10);
    expect(item?.quantity).toBe(2);
  });

  test('passes selectedOptions through and assigns stable group/item indices', () => {
    const payload = buildCommandeCartPayload(previewWithTaco(), META);
    const [item] = payload.state.items;

    expect(item?.selectedOptions).toEqual([
      {
        groupId: 'group-cuid',
        groupName: 'Viandes',
        itemId: 'item-cuid',
        itemName: 'Poulet',
        quantity: 1,
        extraPrice: 1.5,
        groupOrder: 0,
        itemOrder: 0,
      },
    ]);
  });

  test('fills productImage + restaurant meta and defaults missing fields', () => {
    const preview = previewWithTaco();
    const payload = buildCommandeCartPayload(
      {
        ...preview,
        items: [{ ...preview.items[0]!, productName: undefined, note: undefined }],
      },
      META
    );
    const [item] = payload.state.items;

    expect(item?.productName).toBe('Article');
    expect(item?.productImage).toBe('https://commande.app/uploads/products/img.jpg');
    expect(item?.serviceType).toBe('takeaway');
    expect(item?.note).toBe('');
    expect(item?.restaurantId).toBe(META.restaurantId);
    expect(item?.restaurantName).toBe(META.restaurantName);
    expect(item?.restaurantSlug).toBe(META.restaurantSlug);
    expect(item?.id).toMatch(/^cart-\d+-[a-z0-9]+$/);
  });

  test('maps serviceType: delivery → delivery, dineIn → dine_in, pickup → takeaway', () => {
    const pickup = buildCommandeCartPayload(previewWithTaco(), META);
    expect(pickup.state.items[0]?.serviceType).toBe('takeaway');

    const delivery = buildCommandeCartPayload(
      { ...previewWithTaco(), serviceType: 'delivery' },
      META
    );
    expect(delivery.state.items[0]?.serviceType).toBe('delivery');

    const dineIn = buildCommandeCartPayload({ ...previewWithTaco(), serviceType: 'dine_in' }, META);
    expect(dineIn.state.items[0]?.serviceType).toBe('dine_in');
  });

  test('accepts productImages overrides via opts', () => {
    const preview = previewWithTaco();
    const payload = buildCommandeCartPayload(
      { ...preview, items: [{ ...preview.items[0]!, productImage: null }] },
      META,
      { productImages: { 'product-cuid': 'https://example.com/override.jpg' } }
    );
    expect(payload.state.items[0]?.productImage).toBe('https://example.com/override.jpg');
  });
});

describe('buildCommandeInjectionSnippet', () => {
  test('sets three localStorage keys and navigates to the restaurant page', () => {
    const payload = buildCommandeCartPayload(previewWithTaco(), META);
    const snippet = buildCommandeInjectionSnippet(payload, META, 'takeaway');

    expect(snippet).toContain('localStorage.setItem("restaurant-store",');
    expect(snippet).toContain('localStorage.setItem("platfo-step-storage",');
    expect(snippet).toContain(
      `localStorage.setItem(${JSON.stringify(cartStorageKey(META.restaurantSlug))},`
    );
    expect(snippet).toContain(`https://commande.app/${META.restaurantSlug}/checkout/`);
  });

  test('cart blob round-trips through JSON.parse', () => {
    const payload = buildCommandeCartPayload(previewWithTaco(), META);
    const snippet = buildCommandeInjectionSnippet(payload, META, 'takeaway');

    const cartKey = cartStorageKey(META.restaurantSlug);
    const escaped = cartKey.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    const match = snippet.match(new RegExp(`setItem\\("${escaped}", (".*")\\);`));
    expect(match).not.toBeNull();
    const innerJsonString: unknown = JSON.parse(match?.[1] ?? '');
    expect(typeof innerJsonString).toBe('string');
    const parsed: unknown =
      typeof innerJsonString === 'string' ? JSON.parse(innerJsonString) : null;
    expect(parsed).toEqual(payload);
  });
});
