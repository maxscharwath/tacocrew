# 🌮 Tacobot Monorepo

Modern group ordering platform maintained as a pnpm workspace. The repository now houses both the TypeScript API and a new React front-end that adopts the Untitled UI design system and React Router v7 data APIs.

## Apps

- `apps/backend` – Hono + Prisma REST API with rich validation, logging, and DI (formerly `tacos-ordering-api`).
- `apps/frontend` – Vite-powered React application using Router v7 data mode and Untitled UI Icons for the upcoming customer console.

Shared tooling (Biome, linting rules, scripts) lives at the repository root.

## Quick Start

```bash
# Install all workspace dependencies
pnpm install

# Configure backend environment variables
cp apps/backend/.env.example apps/backend/.env  # if you keep an example file
# otherwise create apps/backend/.env and set DATABASE_URL plus secrets

# Configure frontend environment variables
cp apps/frontend/.env.example apps/frontend/.env
# set VITE_API_BASE_URL to the backend origin (defaults to http://localhost:4000)
```

### Run the backend API

```bash
# From the repository root
pnpm dev:backend

# or directly inside the package
pnpm --dir apps/backend dev
```

The API boots on <http://localhost:4000> and exposes Swagger UI at `/docs`. All existing scripts (tests, Prisma tooling, etc.) remain available via `pnpm --filter @tacobot/backend <script>`. If you prefer to run against the bundled mock backend instead of the real service, start `pnpm --filter @tacobot/backend mock:server` and set `BACKEND_BASE_URL` to the mock host in `apps/backend/.env`.

### Run the frontend console

```bash
# From the repository root
pnpm dev:frontend

# or directly inside the package
pnpm --dir apps/frontend dev
```

The Vite dev server runs on <http://localhost:5173> and automatically redirects unauthenticated users to `/login`. Sign in with any backend username (the API will create the user on-demand), then you can:

- Inspect live metrics sourced from `/api/v1/users/me/*` and `/api/v1/stock` on the dashboard.
- Create, manage, and submit group orders in the Orders workspace.
- Build your personal order straight from backend stock data.
- Browse low-stock inventory and review your order history.

## Workspace Scripts

```bash
pnpm dev               # Run every project in dev mode
pnpm dev:backend       # Start only the API (Hono + Prisma)
pnpm dev:frontend      # Start only the Vite/React console
pnpm build             # Build every workspace project
pnpm test              # Run test suites across the workspace
pnpm check             # Type-check the backend package
```

Each package also exposes its own commands (`pnpm --dir apps/<name> <script>`). Backend scripts for Prisma (`prisma:generate`, `prisma:migrate`, `prisma:studio`) are unchanged—just run them through the filter or from the package directory.

## Project Structure

```
apps/
├── backend/
│   ├── package.json
│   ├── prisma/             # Schema, migrations, client
│   ├── src/                # API code (Hono routes, services, DI)
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   ├── router.tsx      # createBrowserRouter configuration (login + protected routes)
│   │   ├── routes/
│   │   │   ├── root.tsx         # Shell + navigation + error boundary
│   │   │   ├── dashboard.tsx    # Data-driven dashboard
│   │   │   ├── orders.list.tsx  # Group order listing + create flow
│   │   │   ├── orders.detail.tsx# Participant management + submission
│   │   │   ├── stock.tsx        # Inventory browser
│   │   │   ├── profile.tsx      # User profile + history
│   │   │   └── login.tsx        # Username-based bearer auth
│   │   └── styles/
│   │       └── global.css
│   ├── tsconfig.json
│   └── vite.config.ts
docs/
scripts/
pnpm-workspace.yaml
package.json              # Workspace orchestrator
biome.json                # Shared lint/format configuration
```

## Backend Highlights

- Authentication (bearer + username header) with session management
- Group and user order orchestration with Prisma-backed persistence
- Stock availability tracking and backend submission flows
- Zod-powered validation + OpenAPI documentation via `@hono/zod-openapi`
- Comprehensive Vitest test suites and logging with Winston

> All backend documentation remains under `docs/` and continues to apply.

## Frontend Highlights

- Vite + React + SWC bundling for fast local iteration
- React Router v7 data mode (`createBrowserRouter`, typed loaders/actions, protected routes)
- Username + bearer auth backed by `/auth`, persisted in local storage, and injected via the HTTP client
- Dashboard, stock browser, orders, and profile experiences sourced from the backend OpenAPI contract
- Untitled UI styling and icons with custom glassmorphism panels for quick customization
- Shared Biome configuration for consistent formatting and linting

To import additional Untitled UI components, run the official CLI from `apps/frontend` when you are ready for interactive selection:

```bash
cd apps/frontend
npx untitledui@latest add button
```

The CLI is interactive, so execute it manually from your terminal session.

## Tooling

- **Package manager**: pnpm 9 (monorepo aware)
- **Type-checking**: TypeScript 5.x per package
- **Lint/format**: Biome (shared config in `biome.json`)
- **Testing**: Vitest (backend)
- **ORM**: Prisma with configurable datasource via `.env`
- **Frameworks**: Hono API, Vite + React UI

## Next Steps

1. Flesh out the React router tree with authenticated routes as the UI evolves.
2. Decide how shared types (e.g., API DTOs) should be published—consider a `packages/` directory for cross-app libraries.
3. Introduce CI pipelines that run `pnpm test`, `pnpm build`, and `pnpm check` per workspace.
4. When ready for production, configure Docker (or another deployment workflow) per app, or introduce an infra directory inside the monorepo.

The monorepo layout keeps both surfaces aligned while letting each evolve independently. 🎉
