# TacoCrew Coding Guidelines

> **Version**: 0.2512.1
> **Last Updated**: December 2025

## Table of Contents

- [Project Overview](#project-overview)
- [Universal TypeScript Rules](#universal-typescript-rules)
- [Code Quality Standards](#code-quality-standards)
- [Monorepo Conventions](#monorepo-conventions)
- [Version Control](#version-control)
- [Code Review Checklist](#code-review-checklist)

---

## Project Overview

TacoCrew is a modern monorepo application for managing taco orders within organizations. The project follows a clean architecture pattern with strict type safety and modern tooling.

### Monorepo Structure

```
tacocrew/
├── apps/
│   ├── api/          # Backend API (Hono + Prisma)
│   ├── web/          # Frontend web app (React + Vite)
│   └── storybook/    # Component documentation
├── packages/
│   ├── ui-kit/             # Shared UI component library
│   ├── gigatacos-client/   # Third-party API client
│   └── mcp-tacocrew/       # MCP server package
└── GUIDELINES.md     # This file
```

### Technology Stack

- **Package Manager**: bun with workspaces
- **Build System**: Turbo for monorepo orchestration
- **TypeScript**: Strict mode across all projects
- **Code Quality**: Biome (linter + formatter)
- **Testing**: Vitest
- **Versioning**: CalVer (0.YYMM.patch)

---

## Universal TypeScript Rules

These rules apply to **all projects** in the monorepo.

### Rule 1: No `any` Types

**❌ DON'T** use `any` type:

```typescript
// Bad
function processData(data: any) {
  return data.value;
}

const items: any[] = getItems();
```

**✅ DO** use proper types or `unknown` with type guards:

```typescript
// Good - Use proper types
interface DataItem {
  readonly value: string;
}

function processData(data: DataItem) {
  return data.value;
}

// Good - Use unknown with type guards
function processUnknownData(data: unknown) {
  if (isDataItem(data)) {
    return data.value;
  }
  throw new Error('Invalid data structure');
}

function isDataItem(value: unknown): value is DataItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    typeof value.value === 'string'
  );
}
```

**Why?**
- `any` disables TypeScript's type checking, defeating the purpose of using TypeScript
- Runtime errors that could be caught at compile time slip through
- Biome enforces this rule with `noExplicitAny: error`

---

### Rule 2: No `as` Type Assertions

**❌ DON'T** use type assertions to bypass type checking:

```typescript
// Bad
const userId = getUserId() as string;
const data = response.data as UserData;
const element = document.getElementById('root') as HTMLDivElement;
```

**✅ DO** use proper typing, validation, or type guards:

```typescript
// Good - Use validation libraries (Zod)
const UserId = z.string().uuid();
const userId = UserId.parse(getUserId());

// Good - Use type guards
function isUserData(value: unknown): value is UserData {
  return UserDataSchema.safeParse(value).success;
}

if (isUserData(response.data)) {
  // TypeScript knows response.data is UserData here
  console.log(response.data.name);
}

// Good - Proper type narrowing
const element = document.getElementById('root');
if (element instanceof HTMLDivElement) {
  element.style.color = 'red';
}
```

**Exception**: `as const` assertions are allowed for literal types:

```typescript
// Allowed - const assertions
const Colors = {
  PRIMARY: 'blue',
  SECONDARY: 'green',
} as const;

const buttonVariants = ['primary', 'secondary', 'ghost'] as const;
type ButtonVariant = (typeof buttonVariants)[number];
```

**Why?**
- Type assertions bypass TypeScript's type safety
- They can hide bugs by forcing incorrect types
- Validation and type guards provide runtime safety

---

### Rule 3: Strict TypeScript Configuration

All projects use strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**✅ DO** handle all cases explicitly:

```typescript
// Good - All branches return a value
function getUserRole(role: string): UserRole {
  switch (role) {
    case 'admin':
      return UserRole.Admin;
    case 'user':
      return UserRole.User;
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

// Good - Check array access
const items = ['a', 'b', 'c'];
const firstItem = items[0]; // Type: string | undefined
if (firstItem) {
  console.log(firstItem.toUpperCase());
}
```

---

### Rule 4: Use `readonly` for Immutable Data

**✅ DO** mark props and immutable data as `readonly`:

```typescript
// Good - Component props
type UserCardProps = {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly onEdit?: (userId: string) => void;
};

// Good - Readonly arrays
type OrderItems = readonly TacoItem[];

// Good - Readonly objects
const CONFIG = {
  MAX_TACOS: 5,
  MIN_ORDER_AMOUNT: 10,
} as const;
```

**Why?**
- Prevents accidental mutations
- Makes data flow more predictable
- Self-documenting code (signals intent)

---

## Code Quality Standards

### Biome Configuration

TacoCrew uses Biome for code formatting and linting.

**Formatting Standards**:
- Indentation: 2 spaces
- Line width: 100 characters
- Semicolons: Always
- Quote style: Single quotes (double for JSX)
- Trailing commas: ES5 style

**Key Linting Rules**:
- `noExplicitAny`: Error - No `any` types
- `noConsole`: Warn (allows `console.warn`, `console.error`, `console.info`)
- `noUnusedVariables`: Error
- `noVar`: Error - Use `const`/`let` only
- `useConst`: Error - Prefer `const` over `let`
- `useSortedClasses`: Error - Auto-sort Tailwind classes

**Running Biome**:

```bash
# Check code quality
bun biome check .

# Fix auto-fixable issues
bun biome check --write .

# Format code
bun biome format --write .
```

---

### Import Organization

**✅ DO** organize imports in this order:

```typescript
// 1. External dependencies (React, third-party libraries)
import { useState, useEffect } from 'react';
import { z } from 'zod';

// 2. Workspace packages
import { Button, Card } from '@tacocrew/ui-kit';
import { TacoSize } from '@tacocrew/gigatacos-client';

// 3. Internal absolute imports (using path aliases)
import { routes } from '@/lib/routes';
import { OrderCard } from '@/components/orders/OrderCard';

// 4. Relative imports
import { useOrderForm } from './useOrderForm';
import type { OrderFormProps } from './types';
```

Biome will auto-organize imports when you run `biome check --write`.

---

### File Naming Conventions

**Directories**: lowercase with hyphens
```
user-order/
group-order/
```

**TypeScript Files**:
- Components: `PascalCase.tsx` (e.g., `UserCard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-date.ts`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useOrderForm.ts`)
- Types: `kebab-case.types.ts` (e.g., `user-order.types.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

**Backend Specific**:
- Services: `{verb}-{entity}.service.ts` (e.g., `create-user-order.service.ts`)
- Repositories: `{entity}.repository.ts` (e.g., `user-order.repository.ts`)
- Schemas: `{entity}.schema.ts` (e.g., `user.schema.ts`)
- Routes: `{entity}.routes.ts` (e.g., `orders.routes.ts`)
- Middleware: `{purpose}.middleware.ts` (e.g., `auth.middleware.ts`)

---

### Error Handling Patterns

**✅ DO** create custom error classes with context:

```typescript
// Good - Custom error class
export class ValidationError extends Error {
  constructor(
    public readonly message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Usage
throw new ValidationError('Invalid user data', {
  email: 'Invalid email format',
  age: 'Must be at least 18',
});
```

**✅ DO** handle errors at appropriate boundaries:

```typescript
// Good - Handle errors in route handlers
export async function createOrder(req: Request) {
  try {
    const order = await orderService.create(req.body);
    return Response.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message, fields: error.fields }, { status: 400 });
    }
    // Log unexpected errors
    console.error('Unexpected error creating order:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Monorepo Conventions

### Workspace Dependencies

**✅ DO** use `workspace:*` protocol for internal packages:

```json
{
  "dependencies": {
    "@tacocrew/ui-kit": "workspace:^",
    "@tacocrew/gigatacos-client": "workspace:*"
  }
}
```

**Protocols**:
- `workspace:^` - Use caret range (recommended for apps)
- `workspace:*` - Use exact version (recommended for packages)

---

### Path Aliases

Each project configures path aliases in `tsconfig.json`:

**Web App**:
```typescript
import { Button } from '@/components/ui';
import { routes } from '@/lib/routes';
```

**API** (optional aliases):
```typescript
import { UserService } from '@services/user/user.service';
import { inject } from '@utils/inject.utils';
```

**✅ DO** prefer absolute imports with aliases over relative imports for better refactoring:

```typescript
// Good
import { OrderCard } from '@/components/orders/OrderCard';

// Acceptable for nearby files
import { useOrderForm } from './useOrderForm';

// Avoid - deeply nested relative imports
import { Button } from '../../../components/ui/Button';
```

---

### Build Orchestration with Turbo

**Development**:
```bash
# Run all apps in dev mode
bun dev

# Run specific app
bun --filter @tacocrew/web dev
bun --filter @tacocrew/api dev
```

**Building**:
```bash
# Build all projects (respects dependencies)
bun build

# Build specific project
bun --filter @tacocrew/ui-kit build
```

**Testing**:
```bash
# Run all tests
bun test

# Run tests for specific project
bun --filter @tacocrew/api test
```

**Dependencies**: Turbo automatically builds dependencies first (e.g., `ui-kit` before `web`).

---

## Version Control

### CalVer Versioning Scheme

TacoCrew uses **Calendar Versioning** (CalVer):

```
0.YYMM.patch
```

| Component | Description | Example |
|-----------|-------------|---------|
| `0` | Beta prefix (becomes `1` at stable) | `0` |
| `YY` | Two-digit year | `25` for 2025 |
| `MM` | Two-digit month | `12` for December |
| `patch` | Patch number within month | `0`, `1`, `2`... |

**Examples**:
- `0.2512.0` - First release in December 2025
- `0.2512.1` - First patch in December 2025
- `1.2601.0` - First stable release in January 2026

---

### Commit Message Conventions

Use conventional commit format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance task (dependencies, build config)
- `refactor:` - Code refactoring (no behavior change)
- `docs:` - Documentation changes
- `test:` - Test additions or updates
- `perf:` - Performance improvements
- `style:` - Code style changes (formatting, missing semicolons)

**IMPORTANT Rules**:
- ❌ **NO Claude/Anthropic mentions** - Don't add "Generated with Claude" or similar
- ❌ **NO Co-Authored-By tags** - Don't add co-author attributions to AI tools
- ❌ **NO emoji in commit messages** - Keep messages clean and professional
- ✅ Keep messages concise and descriptive
- ✅ Focus on WHAT changed and WHY

**Examples**:

```bash
# ✅ Good commit messages
git commit -m "feat: add user profile avatar upload"
git commit -m "fix: prevent duplicate order submission"
git commit -m "chore: bump version to 0.2512.1"
git commit -m "refactor: extract order validation into custom hook"

# With body for context
git commit -m "fix: resolve race condition in order submission

Orders were being submitted twice when users clicked quickly.
Added debounce and disabled state during submission."

# ❌ Avoid
git commit -m "updates"
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "feat: add feature 🎉"  # No emoji
git commit -m "feat: add feature

Generated with Claude Code"  # No Claude mentions

git commit -m "feat: add feature

Co-Authored-By: Claude Sonnet <...>"  # No co-author tags
```

---

### Release Process

See [RELEASE.md](./RELEASE.md) for detailed release instructions.

**Quick summary**:
1. Update version in all `package.json` files
2. Commit with `chore: bump version to 0.YYMM.X`
3. Create and push git tag `v0.YYMM.X`
4. Create GitHub release with notes

**Using the `/release` command**:
```bash
# Automated release via Claude Code
/release
```

---

## Code Review Checklist

Use this checklist when reviewing pull requests:

### Type Safety
- [ ] No `any` types used
- [ ] No `as` type assertions (except `as const`)
- [ ] All TypeScript errors resolved
- [ ] Proper type guards for unknown data
- [ ] Props marked as `readonly` where appropriate

### Code Quality
- [ ] Biome checks pass (`bun biome check .`)
- [ ] No console.log statements (use logger or remove)
- [ ] Imports organized correctly
- [ ] File naming follows conventions
- [ ] No unused variables or imports

### Architecture
- [ ] Follows project-specific guidelines (see project GUIDELINES.md)
- [ ] Proper separation of concerns
- [ ] No business logic in routes/components
- [ ] Consistent error handling

### Testing
- [ ] New features have tests
- [ ] Tests are passing (`bun test`)
- [ ] Edge cases covered

### Documentation
- [ ] Complex logic has comments
- [ ] Public APIs have JSDoc comments
- [ ] README updated if needed

### Performance
- [ ] No unnecessary re-renders (React)
- [ ] Large lists use pagination/virtualization
- [ ] Images optimized

### Security
- [ ] User input validated (Zod schemas)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Secrets not committed

---

## Project-Specific Guidelines

Each project has additional guidelines:

- **Backend API**: [apps/api/GUIDELINES.md](./apps/api/GUIDELINES.md)
- **Frontend Web**: [apps/web/GUIDELINES.md](./apps/web/GUIDELINES.md)
- **UI Kit**: [packages/ui-kit/GUIDELINES.md](./packages/ui-kit/GUIDELINES.md)
- **Gigatacos Client**: [packages/gigatacos-client/GUIDELINES.md](./packages/gigatacos-client/GUIDELINES.md)

---

## Resources

- [Biome Documentation](https://biomejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Zod Documentation](https://zod.dev/)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [bun Workspaces](https://bun.io/workspaces)
