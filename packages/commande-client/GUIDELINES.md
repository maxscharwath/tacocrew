# Commande Client Package Guidelines

> **Package**: `@tacocrew/commande-client`
> **Purpose**: Typed, generic tRPC client for the `commande.app` SaaS.
> **Stack**: TypeScript, native `fetch`, Zod.

## Scope

The package is a **thin, generic** wrapper over the `commande.app` tRPC API. It must stay
free of domain-specific concepts (no tacos, no size configs, no meat/sauce/garniture mapping).
Consumers in `apps/api` own all domain translation.

## Core rules

- No `any` types. Use `unknown` + guards or Zod schemas.
- No `as` type assertions, except `as const`. Prefer Zod parsing over assertions.
- All public props and fields are `readonly`.
- No narrative comments. Only document *why* when non-obvious.
- `noConsole` is a warning only for `warn|error|info|log` — prefer the injected `Logger`.
- Do not use `z.nativeEnum`. Use `z.enum([...])` with string unions.
- Every resource method accepts an optional `{ signal?: AbortSignal }` last argument.
- Every network response is parsed with a Zod schema; parse failures throw `ValidationError`.

## Layout

```
src/
  client.ts              CommandeClient facade composing resources
  types.ts               Exported types (no runtime logic except constant arrays)
  errors.ts              CommandeError + subclasses
  trpc/
    envelope.ts          encode/decode { "0": { json } }
    errors.ts            tRPC error code → CommandeError mapping
    trpc-fetch.ts        GET/POST fetch wrapper
  resources/             Thin, namespaced resource classes
  schemas/               Zod schemas for responses
  tracking/poll-order.ts Async-iterable polling helper
  images/product-image.ts URL helper
  utils/logger.ts        noopLogger
  __fixtures__/          Hand-written JSON payloads for tests
```

## HTTP conventions

- GET URL: `<base>/api/trpc/<procedure>?batch=1&input=<encoded>` where
  `encoded = encodeURIComponent(JSON.stringify({ "0": { "json": input } }))`.
- POST URL: `<base>/api/trpc/<procedure>?batch=1`, body = `{ "0": { "json": input } }`,
  `content-type: application/json`.
- Default request headers include `accept: */*` and `x-trpc-source: nextjs-react`.
- The inner payload is always at `response[0].result.data.json`.

## Errors

- `CommandeError` is the base class with a readonly `.code` of type `CommandeErrorCode`.
- Narrow subclasses: `NotFoundError`, `RateLimitError`, `RestaurantClosedError`,
  `ValidationError`, `NetworkError`.
- tRPC codes mapped:
  - `NOT_FOUND` → `NotFoundError`
  - `TOO_MANY_REQUESTS` → `RateLimitError`
  - `BAD_REQUEST` / `PARSE_ERROR` / `UNPROCESSABLE_CONTENT` → `ValidationError`
  - anything else → `CommandeError` with code `UNKNOWN`
- `data.code === 'RESTAURANT_CLOSED'` short-circuits to `RestaurantClosedError`.

## Logging

The package never writes to `console` directly. A `Logger` interface is injected by the
consumer. `noopLogger` is the default.

## Tests

- `bun test`, importing from `bun:test`.
- Mock `fetch` per test. Wrap fixtures with the envelope at call time.
- Each resource has at least one happy path and one error path test.
- `poll-order.test.ts` uses a fixed sequence plus a stubbed `sleep` to avoid real timers.

## Fixtures

Fixtures are **unwrapped** payloads (just the inner `json` object, not the full envelope).
They are hand-written, tiny (< 2 KB), and use fake customer data. Do not bundle the HAR file.
