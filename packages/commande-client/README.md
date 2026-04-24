# @tacocrew/commande-client

Typed, generic tRPC client for the third-party restaurant-ordering SaaS `commande.app`.

This package is a **thin wrapper** over the `/api/trpc/*` procedures exposed by `commande.app`.
It has no taco-specific concepts — consumers map domain concepts on top.

## Installation

This package lives inside the TacoCrew monorepo and is consumed by `apps/api`. It expects
`zod ^4` as a peer dependency (already pinned via the root `overrides`).

## Quick start

```ts
import { CommandeClient, noopLogger } from '@tacocrew/commande-client';

const client = new CommandeClient({
  baseUrl: 'https://commande.app',
  logger: noopLogger,
});

const restaurant = await client.restaurant.getBySlug({ slug: 'giga-tacos-pontaise-lausanne' });
const { products } = await client.menu.getMenuItems({ restaurantId: restaurant.id });

const { orderId } = await client.order.create({
  restaurantId: restaurant.id,
  serviceType: 'delivery',
  items: [/* … */],
  total: 16,
  isPreorder: true,
  pickupTime: '2026-04-24T09:50:00.000Z',
  pickupEndTime: '2026-04-24T10:00:00.000Z',
  dineIn: false,
  isOnSite: false,
  deliveryFee: 2,
  customerName: 'Test Customer',
  customerPhone: '+41 21 000 00 00',
  guestDeliveryAddress: 'Rue Test 1, 1000 Lausanne',
  paymentMethod: 'twint',
});

for await (const update of client.tracking.pollOrder({ orderId, restaurantId: restaurant.id })) {
  if (update.status === 'delivered' || update.status === 'cancelled') break;
}
```

## Public API

- `CommandeClient` — composes resources + tracking.
- Resources: `restaurant`, `menu`, `order`, `delivery`, `payment`, `user`.
- `client.tracking.pollOrder(opts)` — `AsyncIterable<OrderStatusUpdate>`, cooperates with `AbortSignal`.
- `resolveProductImage(url, opts?)` — unchanged passthrough, or builds Next.js image-optimizer URL.
- Error classes: `CommandeError`, `NotFoundError`, `RateLimitError`, `RestaurantClosedError`,
  `ValidationError`, `NetworkError`.

Every resource method accepts an optional `{ signal?: AbortSignal }` as its final argument.

## Transport details

- Native `fetch`. No axios.
- `GET /api/trpc/<procedure>?batch=1&input=<URL-encoded JSON>` for queries.
- `POST /api/trpc/<procedure>?batch=1` with body `{ "0": { "json": … } }` for mutations.
- Response envelope `[{ result: { data: { json: … } } }]` is unwrapped automatically.
- tRPC error codes (`NOT_FOUND`, `TOO_MANY_REQUESTS`, `BAD_REQUEST`, …) map to the matching
  `CommandeError` subclass. A `data.code === 'RESTAURANT_CLOSED'` marker is mapped to
  `RestaurantClosedError` regardless of the outer code.

## Scripts

- `bun run check` — type check only.
- `bun test` — run all unit tests with mocked `fetch`.

## Fixtures

`src/__fixtures__/*.json` contains hand-written, minimal, **unwrapped** tRPC payloads
(everything inside `result.data.json`). Tests wrap them with the envelope at call time.
Customer-identifying data is fake.

See [GUIDELINES.md](./GUIDELINES.md) for coding conventions.
