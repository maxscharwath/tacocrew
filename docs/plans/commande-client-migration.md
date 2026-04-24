# Commande.app client migration plan

**Status:** In progress
**Started:** 2026-04-24

## Context

Giga Tacos (Lausanne) replaced its bespoke PHP backend at `gt-lausanne.ch` with the third-party SaaS `commande.app`. The two systems share nothing:

| | Old (`gt-lausanne.ch`) | New (`commande.app`) |
|---|---|---|
| Transport | PHP AJAX (`/ajax/*.php`) | tRPC over HTTPS (`/api/trpc/*`) |
| Payload | `FormData` + CSRF token | JSON (`{ json: … }` tRPC envelope) |
| Auth | PHP session cookies + CSRF | Mostly public; NextAuth cookie for some calls |
| Response | HTML → scraped with cheerio | Typed JSON |
| Domain | Tacos-first (`taille`, `viande`, `sauce`, `garniture`) | Generic menu (`product`, `optionGroup`, `option`, `variant`) |
| Real-time | None | HTTP polling of `order.getActivePreorders` |
| Product images | None | `product.imageUrl` served from `commande.app/uploads/products/…` |

HAR capture: [`packages/gigatacos-client/commande.app.har`](../../packages/gigatacos-client/commande.app.har).

## Strategy

1. Create a **new package** [`@tacocrew/commande-client`](../../packages/commande-client/) — a thin, generic tRPC wrapper over `commande.app` (no taco concepts inside).
2. Leave [`packages/gigatacos-client`](../../packages/gigatacos-client/) in the repo, marked deprecated, with all consumers removed.
3. Migrate [`apps/api`](../../apps/api/) to consume the new package, moving taco-specific mapping (`TacoSize`, `TACO_SIZE_CONFIG`, `OrderType`, `Meat`/`Sauce`/`Garniture`) into a new domain module at [`apps/api/src/domain/taco-config.ts`](../../apps/api/src/domain/taco-config.ts).
4. Drop the `csrfToken` / `cookies` columns from the `Cart` Prisma model.
5. Swap [`apps/web`](../../apps/web/) import paths for `TacoSize` / `TACO_SIZE_CONFIG`.

## Deliverables

- **New**: `@tacocrew/commande-client` package with full test coverage + HAR-based fixtures.
- **New**: `apps/api/src/domain/taco-config.ts` (moved from the old client + new mappers).
- **New**: `apps/api/src/infrastructure/api/commande-integration.client.ts` (replaces `backend-integration.client.ts`).
- **Migration**: Prisma `drop_cart_csrf_fields`.
- **Deprecation**: `packages/gigatacos-client` marked deprecated, no consumers.

---

## Task breakdown (for parallel sub-agent execution)

Each task is **self-contained** and lists:
- its dependencies,
- the files it owns,
- the test expectations it must satisfy before being marked done.

### Phase 1 — Commande client package (foundation)

**Depends on:** nothing. Can start immediately.

**Parallelizable?** No — single agent. Shared files (package.json, types.ts, trpc/*) make parallelization risky.

**Files owned (new):**

- `packages/commande-client/package.json`
- `packages/commande-client/tsconfig.json`
- `packages/commande-client/README.md`
- `packages/commande-client/GUIDELINES.md`
- `packages/commande-client/src/index.ts`
- `packages/commande-client/src/client.ts`
- `packages/commande-client/src/types.ts`
- `packages/commande-client/src/errors.ts`
- `packages/commande-client/src/utils/logger.ts`
- `packages/commande-client/src/trpc/trpc-fetch.ts`
- `packages/commande-client/src/trpc/envelope.ts`
- `packages/commande-client/src/trpc/errors.ts`
- `packages/commande-client/src/resources/restaurant.ts`
- `packages/commande-client/src/resources/menu.ts`
- `packages/commande-client/src/resources/order.ts`
- `packages/commande-client/src/resources/delivery.ts`
- `packages/commande-client/src/resources/payment.ts`
- `packages/commande-client/src/resources/user.ts`
- `packages/commande-client/src/tracking/poll-order.ts`
- `packages/commande-client/src/images/product-image.ts`
- `packages/commande-client/src/schemas/*.ts` (one per resource)
- `packages/commande-client/scripts/extract-fixtures.ts`
- `packages/commande-client/src/__fixtures__/*.json`
- `packages/commande-client/src/**/*.test.ts`

**Acceptance:**

- `cd packages/commande-client && bun run check` passes.
- `cd packages/commande-client && bun test` passes.
- All public API matches the plan's "Public API sketch" (see below).
- `Product.imageUrl` is populated in `menu.getMenuItems` parse result.
- `tracking.pollOrder({ … })` is an async iterable that yields `OrderStatus` updates and stops on terminal states.

### Phase 2 — apps/api domain module

**Depends on:** Phase 1 complete (needs the published types).

**Parallelizable?** Yes — can run alongside Phase 3a + 3b.

**Files owned:**

- NEW `apps/api/src/domain/taco-config.ts` — exports `TacoSize` (enum), `TacoSizeConfig` (interface), `TACO_SIZE_CONFIG` (const), `OrderType` (enum), `mapProductToTaco(product: Product): Taco`, `mapOptionGroup(group, kind): Meat[] | Sauce[] | Garniture[]`.
- NEW `apps/api/src/domain/taco-config.test.ts`.

**Acceptance:**

- `bun test` for `apps/api/src/domain/taco-config.test.ts` passes.
- No runtime dependency on `@tacocrew/gigatacos-client`.

### Phase 3 — apps/api consumer rewrites

Split into independent-ish tracks. Each can be its own sub-agent.

#### 3a — Infrastructure client

**Depends on:** Phase 1, Phase 2.

**Files owned:**

- NEW `apps/api/src/infrastructure/api/commande-integration.client.ts` (replaces `backend-integration.client.ts`).
- NEW `apps/api/src/infrastructure/api/commande-integration.client.test.ts`.
- DELETE `apps/api/src/infrastructure/api/backend-integration.client.ts`.

**Acceptance:**

- `CommandeIntegrationClient` exposes the methods listed in `#apps-api-rewrite` below.
- No CSRF retry logic, no session cookies.
- Tests mock `CommandeClient` and assert correct request shapes.

#### 3b — Services

**Depends on:** Phase 2, Phase 3a.

**Files owned:**

- `apps/api/src/services/order/backend-order-submission.service.ts`
- `apps/api/src/services/order/backend-order-submission.service.test.ts` (if exists — update)
- `apps/api/src/services/session/session.service.ts`
- `apps/api/src/services/session/session.service.test.ts` (if exists)
- `apps/api/src/services/group-order/submit-group-order.service.ts`
- `apps/api/src/services/resource/resource.service.ts`
- `apps/api/src/services/resource/resource.service.test.ts` (new or update)
- `apps/api/src/services/user-order/create-user-order.service.test.ts` (import swap only)

**Acceptance:**

- All services import from `@tacocrew/commande-client` or the new `apps/api/src/domain/taco-config.ts` — never from `@tacocrew/gigatacos-client`.
- Unit tests green.
- No `csrfToken` / `cookies` references in persistence.

#### 3c — Error middleware, schemas, routes

**Depends on:** Phase 1, Phase 2.

**Files owned:**

- `apps/api/src/api/middleware/error-handler.middleware.ts`
- `apps/api/src/api/middleware/error-handler.middleware.test.ts` (if exists)
- `apps/api/src/schemas/order.schema.ts`
- `apps/api/src/schemas/taco.schema.ts`
- `apps/api/src/api/schemas/user-order.schemas.ts`
- `apps/api/src/api/routes/user-order.routes.ts`
- `apps/api/src/api/routes/resource.routes.ts`
- `apps/api/src/shared/types/types.ts`

**Acceptance:**

- Error middleware drops 403/CSRF case; adds 400 `ValidationError` and 404 `NotFoundError` mappings; keeps 429/502/503.
- All schemas and routes import enums from `apps/api/src/domain/taco-config.ts` or `@tacocrew/commande-client`.

### Phase 4 — Prisma migration

**Depends on:** Phase 3b (session service updated to not read the dropped fields).

**Files owned:**

- `apps/api/prisma/schema.prisma`
- NEW `apps/api/prisma/migrations/<timestamp>_drop_cart_csrf_fields/migration.sql`

**Acceptance:**

- `bunx prisma migrate dev` produces a clean migration.
- `bunx prisma generate` produces a `Cart` type without `csrfToken` / `cookies`.

### Phase 5 — apps/web import swaps

**Depends on:** Phase 2.

**Files owned:**

- `apps/web/src/types/orders.ts`
- `apps/web/src/types/form-data.ts`
- `apps/web/src/utils/order-form-parser.ts`
- `apps/web/src/lib/taco-config.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/routes/orders.create.tsx`

**Acceptance:**

- No `@tacocrew/gigatacos-client` imports remain in `apps/web`.
- `bun tsc --noEmit` for `apps/web` passes.

### Phase 6 — Deprecate `packages/gigatacos-client`

**Depends on:** all other phases (no consumers left).

**Files owned:**

- `packages/gigatacos-client/package.json` (add `"deprecated": …`)
- `packages/gigatacos-client/README.md` (new — deprecation banner)
- `packages/gigatacos-client/GUIDELINES.md` (banner prepended)

**Acceptance:**

- `grep -r "@tacocrew/gigatacos-client" apps/ packages/commande-client/` returns nothing.

### Phase 7 — Full repo verification

**Depends on:** all previous phases.

1. `bun tsc --noEmit` (monorepo) clean.
2. `bun biome check --write .` clean.
3. `bun test` clean.
4. `bunx prisma migrate dev` replays.

---

## Package design: `@tacocrew/commande-client`

### Layout

```
packages/commande-client/
  src/
    index.ts                      # Barrel
    client.ts                     # CommandeClient — public facade
    trpc/
      trpc-fetch.ts               # fetch-based tRPC caller (batch=1, input URL-encoding)
      envelope.ts                 # { json } encode/decode
      errors.ts                   # TRPC error → CommandeError mapping
    resources/                    # Thin wrappers around trpc-fetch, one per tRPC namespace
      restaurant.ts               # getAllPublic, getBySlug, getById
      menu.ts                     # getMenuItems, getCombinations
      order.ts                    # create, getConfirmation, getActivePreorders,
                                  # getRestaurantStatus, potentialCreate
      delivery.ts                 # getZoneByPostalCode, getCityFromPostalCode, geocodeAddress
      payment.ts                  # getAvailableMethods
      user.ts                     # checkSmsRequirementPublic
    tracking/
      poll-order.ts               # pollOrder(...) → AsyncIterable<OrderStatus>
    images/
      product-image.ts            # resolveProductImage(url, opts?)
    types.ts                      # Product, OptionGroup, Option, Variant, Order, OrderStatus, …
    schemas/                      # Zod schemas validating tRPC responses
    errors.ts                     # CommandeError + NotFoundError / RateLimitError /
                                  # RestaurantClosedError / ValidationError / NetworkError
    utils/logger.ts               # noop Logger
  scripts/extract-fixtures.ts     # HAR → src/__fixtures__/*.json (run once)
  src/__fixtures__/*.json         # Checked-in offline fixtures
  src/**/*.test.ts                # Co-located tests
```

### Public API sketch

```ts
const client = new CommandeClient({ baseUrl: 'https://commande.app', logger });

// Menu + images
const { products, combinations } = await client.menu.getMenuItems({ restaurantId });
// Each product: { id, name, price, imageUrl, optionGroups, variants }

// Order creation (matches commande.app shape directly)
const { orderId } = await client.order.create({
  restaurantId,
  serviceType: 'delivery',
  items: [...],
  customerName, customerPhone, guestDeliveryAddress,
  paymentMethod: 'twint',
  isPreorder, pickupTime, pickupEndTime,
  deliveryFee, total,
});

// Tracking — raw methods
const preorders = await client.order.getActivePreorders({ restaurantId });
const confirmation = await client.order.getOrderConfirmation({ orderId });

// Tracking — polling helper
for await (const status of client.tracking.pollOrder({ orderId, restaurantId, intervalMs: 7000, signal })) {
  if (status.state === 'delivered' || status.state === 'cancelled') break;
}
```

### Type vocabulary (exported)

- `Product`, `OptionGroup`, `Option`, `Variant`, `Combination`
- `Order`, `OrderItem`, `OrderStatus` (`pending | confirmed | preparing | ready | out_for_delivery | delivered | cancelled`)
- `ServiceType` (`delivery | pickup | dineIn`)
- `PaymentMethod` (`twint | stripe | card | cash`)
- `Restaurant`, `RestaurantStatus`, `DeliveryZone`
- `Logger`
- Error classes

### HTTP layer

- Native `fetch` (Node 20+/Bun). **No** axios, **no** cheerio.
- tRPC GET: `/<procedure>?batch=1&input=<url-encoded JSON { "0": { "json": … } }>`.
- tRPC POST: body `{ "0": { "json": … } }` when `batch=1`.
- Response envelope: `[{ result: { data: { json: … } } }]`; unwrap in `trpc/envelope.ts`.
- `AbortSignal` support on every method.
- Optional `logger` in config.

### Errors

- `CommandeError` base with `.code` (`'NOT_FOUND' | 'RATE_LIMIT' | 'RESTAURANT_CLOSED' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN'`).
- Narrow subclasses: `NotFoundError`, `RateLimitError`, `RestaurantClosedError`, `ValidationError`, `NetworkError`.
- **No** `CsrfError`, **no** session concept.

---

## apps/api rewrite details

| File | Current coupling | New |
|---|---|---|
| `apps/api/src/infrastructure/api/backend-integration.client.ts` | Wraps legacy client; `executeWithRetry` for CSRF | REPLACE with `commande-integration.client.ts` mapping commande.app → taco domain. No retry. |
| `apps/api/src/services/order/backend-order-submission.service.ts` | `getOrderSummary`, `submitOrder`, fields on `OrderSubmissionResponse` | Use `order.create` + reconstruct summary from cart state. |
| `apps/api/src/services/group-order/submit-group-order.service.ts` | `StoreClosedError`, `OrderSummary`, `PaymentMethod` imports | Swap to `RestaurantClosedError` + commande-client types. |
| `apps/api/src/services/session/session.service.ts` | Persists `csrfToken` + `cookies` per cart | Strip those fields. Keep id/createdAt/lastActivityAt/metadata. |
| `apps/api/src/services/resource/resource.service.ts` | `TACO_SIZE_CONFIG`, legacy `getStock` | Import `TACO_SIZE_CONFIG` from `apps/api/src/domain/taco-config.ts`. Replace `getStock` with an adapter that calls `menu.getMenuItems` and maps `Viande`/`Sauce`/`Garniture` option groups to stock shape. |
| `apps/api/src/api/middleware/error-handler.middleware.ts` | `CsrfError`→403, `RateLimitError`→429, `NetworkError`→502, `StoreClosedError`→503 | Drop 403. Keep 429/502/503. Add `NotFoundError`→404, `ValidationError`→400. |
| `apps/api/src/schemas/{order,taco}.schema.ts`, `apps/api/src/api/schemas/user-order.schemas.ts` | Imports `OrderStatus` / `OrderType` / `TacoSize` from old client | Import from new domain module / commande-client. |
| `apps/api/src/api/routes/{user-order,resource}.routes.ts` | Uses `OrderType`, `TacoSize` | Update imports. |
| `apps/api/src/shared/types/types.ts` | Re-exports `OrderType`, `TacoSize` | Re-export from new domain module. |

---

## Tests (first-class deliverable)

All tests use `bun test`. Fixtures are extracted once from `commande.app.har` into `packages/commande-client/src/__fixtures__/*.json` (redacted: customer name/phone/address replaced with fake values).

### `packages/commande-client`

- `trpc/trpc-fetch.test.ts` — URL-encodes `input` to match HAR exactly for 3 sample procedures.
- `trpc/envelope.test.ts` — round-trip `{ json }`, unwrap `[{ result: { data: { json } } }]`.
- `trpc/errors.test.ts` — maps tRPC error codes → `CommandeError` subclasses.
- `resources/<name>.test.ts` — one file per resource, happy + error path each, using fixtures.
- `tracking/poll-order.test.ts` — yields through `pending → confirmed → … → delivered`; stops on terminal; respects `AbortSignal`; uses fake timers.
- `images/product-image.test.ts` — leaves direct URLs untouched; builds `/_next/image/?url=…&w=…&q=…`.
- `schemas/*.test.ts` — round-trip each fixture; negative test for missing required field.
- `src/__integration__/live.test.ts` — opt-in via `COMMANDE_LIVE=1`, hits real API.

### `apps/api`

- `domain/taco-config.test.ts` — all six sizes; `mapProductToTaco` snapshot; `mapOptionGroup` for each kind.
- `infrastructure/api/commande-integration.client.test.ts` — mock `CommandeClient`, assert domain transforms.
- `services/order/backend-order-submission.service.test.ts` — update mocks to the new client.
- `services/session/session.service.test.ts` — drop CSRF/cookie cases.
- `services/resource/resource.service.test.ts` — assert stock is now derived from `menu.getMenuItems`.
- `api/middleware/error-handler.middleware.test.ts` — drop 403, add 400/404, keep rest.

### Conventions

- No network in `bun test` unless `COMMANDE_LIVE=1`.
- Fixtures < 10 KB each; the full 44 MB HAR stays out of the runtime bundle.
- Each new file has ≥ 1 negative-path test.

---

## Verification (end of implementation)

1. `bun tsc --noEmit` — no surviving `@tacocrew/gigatacos-client` imports outside its own package.
2. `bun biome check --write .` — clean.
3. `bun test` (monorepo) — all green.
4. `bunx prisma migrate dev` — new migration applies; `bunx prisma generate` produces `Cart` type without `csrfToken` / `cookies`.
5. Optional local: `COMMANDE_LIVE=1 bun test -t live` — real `commande.app` returns products with `imageUrl`.
6. Smoke: `bun dev:api` + walk one order through existing routes.

---

## Progress log

- [x] **Phase 1** — Commande client package — 69 tests pass, tsc clean
- [x] **Phase 2** — `apps/api/src/domain/taco-config.ts` — 11 tests pass
- [x] **Phase 3a** — `commande-integration.client.ts` — 12 tests pass, tsc clean. `StockInfo` + `StockAvailability` + `classifyProductCategory` added to `taco-config.ts`.
- [x] **Phase 3b** — services rewired to `CommandeIntegrationClient`; legacy `backend-integration.client.ts` deleted; legacy `/orders/{id}/cookies` endpoint removed (no longer meaningful against commande.app)
- [x] **Phase 3c** — error middleware + schemas + routes — 7 files updated, tsc clean
- [x] **Phase 4** — Prisma migration `20260424_drop_cart_csrf_fields` — `Cart.csrfToken` + `Cart.cookies` dropped; Prisma client regenerated
- [x] **Phase 5** — `apps/web` import swaps — tsc clean
- [x] **Phase 6** — `@tacocrew/gigatacos-client` marked deprecated (`package.json#deprecated`, README banner, GUIDELINES banner)
- [x] **Phase 7** — Verification: `@tacocrew/commande-client` 69/69 tests pass · `apps/api` 118 pass / 5 fail (identical to pre-migration baseline on `main` — zero regressions) · apps/api tsc errors: 24 (identical to pre-migration baseline) · biome clean across all migration-touched code · no remaining `@tacocrew/gigatacos-client` imports outside deprecation comments.
