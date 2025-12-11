# Route Patterns Guide

This document outlines the established patterns for creating and refactoring routes in the TacoCrew web application.

## Table of Contents

- [Core Principles](#core-principles)
- [Loader Patterns](#loader-patterns)
- [Action Patterns](#action-patterns)
- [Component Composition](#component-composition)
- [Form Handling](#form-handling)
- [Type Safety](#type-safety)
- [Examples](#examples)

## Core Principles

### DRY (Don't Repeat Yourself)

- Extract reusable components from large route files
- Use utility functions for common patterns (loaders, actions, validators)
- Share components across routes when appropriate

### Type Safety

- Use TypeScript for all route code
- Leverage type inference from loader/action functions
- Avoid `any` types - use proper types or `unknown` with type guards

### Component Composition

- Break large route components (>400 LOC) into smaller, focused components
- Extract sections with their own state management into dedicated components
- Use custom hooks for complex state logic

## Loader Patterns

### Basic Loader with Authentication

Use `createLoader` for synchronous data loading with automatic auth handling:

```typescript
import { createLoader } from '@/lib/utils/loader-factory';
import type { LoaderData as ExtractLoaderData } from '@/lib/types/loader-types';

export const profileLoader = createLoader(
  async () => {
    const profile = await UserApi.getProfile();
    const settings = await UserApi.getSettings();

    return { profile, settings };
  },
  { requireAuth: true }
);

type LoaderData = ExtractLoaderData<typeof profileLoader>;
```

**Benefits**:
- Automatic `Response.json()` wrapping
- Built-in authentication checking
- Consistent error handling
- Type inference for loader data

### Deferred Loading with Suspense

Use `createDeferredLoader` for slow data that should load progressively:

```typescript
import { createDeferredLoader } from '@/lib/utils/loader-factory';
import { DeferredRoute } from '@/components/shared';

export const dashboardLoader = createDeferredLoader(
  async () => {
    const data = await loadDashboardData();
    return { data };
  },
  { requireAuth: true }
);

type LoaderData = ExtractLoaderData<typeof dashboardLoader>;

export function DashboardRoute() {
  const { data } = useLoaderData<LoaderData>();

  return (
    <DeferredRoute data={data} fallback={<DashboardSkeleton />}>
      {(resolvedData) => <DashboardContent data={resolvedData} />}
    </DeferredRoute>
  );
}
```

### Param Validation

Use `requireParam` for type-safe route parameter validation:

```typescript
import { requireParam } from '@/lib/utils/param-validators';

export const orderDetailLoader = createLoader(
  async ({ params }) => {
    const orderId = requireParam(params, 'orderId', 'Order not found');
    const order = await OrdersApi.getOrder(orderId);
    return { order };
  },
  { requireAuth: true }
);
```

### Complex Loaders

For loaders with complex business logic that doesn't fit the factory pattern:

```typescript
// Keep explicit type definition before loader
type LoaderData = {
  data: Awaited<ReturnType<typeof SomeApi.getData>>;
  metadata: SomeMetadata;
};

export const complexLoader = createLoader(
  async ({ params, request }) => {
    const id = requireParam(params, 'id');
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter');

    // Complex logic here
    const [data, metadata] = await Promise.all([
      SomeApi.getData(id, filter),
      SomeApi.getMetadata(id),
    ]);

    if (someBusinessLogic(data)) {
      throw redirect('/somewhere-else');
    }

    return { data, metadata };
  },
  { requireAuth: true }
);
```

## Action Patterns

### Form Actions

Use `createActionHandler` for type-safe form handling:

```typescript
import { createActionHandler } from '@/lib/utils/action-handler';
import { parseFormData } from '@/lib/utils/form-data';
import type { UpdateProfileFormData } from '@/lib/types/form-data';

export const profileAction = createActionHandler({
  handlers: {
    POST: async ({ formData }) => {
      const data = parseFormData<UpdateProfileFormData>(formData);
      await UserApi.updateProfile(data);
    },
  },
  getFormName: () => 'updateProfile',
  onSuccess: () => redirect(routes.root.profile()),
});
```

## Component Composition

### When to Extract Components

Extract a component from a route when:

1. **Section exceeds ~100 lines** - Extract to dedicated component
2. **Self-contained state** - Component manages its own state/API calls
3. **Reusability** - Used in multiple routes or could be in the future
4. **Testing** - Makes the section easier to unit test

### Example: Extracting Push Notifications

**Before** (1,105 lines in `profile.account.tsx`):
```typescript
export function AccountRoute() {
  const [pushSubscriptions, setPushSubscriptions] = useState([]);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  // ... 200+ lines of push notification logic ...

  return (
    <div>
      {/* 236 lines of push notification UI */}
    </div>
  );
}
```

**After** (699 lines in `profile.account.tsx`, 369 lines in `PushNotificationManager.tsx`):
```typescript
// profile.account.tsx
export function AccountRoute() {
  return (
    <div>
      <PushNotificationManager />
    </div>
  );
}

// PushNotificationManager.tsx
export function PushNotificationManager() {
  const [pushSubscriptions, setPushSubscriptions] = useState([]);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  // All push notification logic self-contained
}
```

### Shared vs Route-Specific Components

**Shared Components** (`apps/web/src/components/shared/`):
- Used across multiple routes
- Generic, reusable patterns
- Examples: `BackButton`, `PageHero`, `EditActionButtons`, `DeferredRoute`

**Route-Specific Components** (`apps/web/src/components/{domain}/`):
- Specific to a domain (orders, profile, etc.)
- May use domain-specific types/APIs
- Examples: `TacoBuilder`, `PushNotificationManager`, `OrderSummary`

## Form Handling

### Custom Hooks for Form State

Extract complex form state into custom hooks:

```typescript
// useDeliveryForm.ts
export function useDeliveryForm({ initialProfiles, t }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [road, setRoad] = useState('');
  // ... more state

  const handleSaveProfile = async () => {
    // Save logic
  };

  return {
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    road,
    setRoad,
    handleSaveProfile,
  };
}

// orders.submit.tsx
export function OrderSubmitRoute() {
  const form = useDeliveryForm({ initialProfiles, t });

  return (
    <Form method="post">
      <DeliveryFormFields form={form} />
    </Form>
  );
}
```

### Form Validation

```typescript
import { useOrderValidation } from '@/hooks/useOrderValidation';

export function OrderCreateRoute() {
  const { hasTaco, hasOtherItems, validationMessages, canSubmit } = useOrderValidation({
    size,
    meats,
    sauces,
    garnitures,
    extras,
    drinks,
    desserts,
    selectedTacoSize,
  });

  return (
    <Form method="post">
      {/* form fields */}
      <Button type="submit" disabled={!canSubmit}>
        {t('submit')}
      </Button>
    </Form>
  );
}
```

## Type Safety

### Loader Data Types

**Simple case** (use type extraction):
```typescript
import type { LoaderData as ExtractLoaderData } from '@/lib/types/loader-types';

export const loader = createLoader(async () => {
  return { data: await Api.getData() };
});

type LoaderData = ExtractLoaderData<typeof loader>;
```

**Complex case** (explicit type definition):
```typescript
// Define type before loader to avoid circular reference
type LoaderData = {
  data: Awaited<ReturnType<typeof Api.getData>>;
  metadata: SomeType;
};

export const loader = createLoader(async () => {
  // implementation
}, { requireAuth: true });
```

### Component Props

Always use `readonly` for props:

```typescript
type TacoBuilderProps = {
  readonly size: TacoSizeCode;
  readonly meats: ReadonlyArray<{ readonly id: string; readonly quantity: number }>;
  readonly onUpdateMeatQuantity: (meatId: string, quantity: number) => void;
};

export function TacoBuilder({ size, meats, onUpdateMeatQuantity }: TacoBuilderProps) {
  // implementation
}
```

## Examples

### Complete Route Example

```typescript
import { createLoader } from '@/lib/utils/loader-factory';
import type { LoaderData as ExtractLoaderData } from '@/lib/types/loader-types';
import { requireParam } from '@/lib/utils/param-validators';
import { createActionHandler } from '@/lib/utils/action-handler';
import { BackButton } from '@/components/shared';
import { SomeComponent } from '@/components/domain';

// Loader with auth and param validation
export const exampleLoader = createLoader(
  async ({ params }) => {
    const id = requireParam(params, 'id');
    const data = await SomeApi.getData(id);
    return { data };
  },
  { requireAuth: true }
);

type LoaderData = ExtractLoaderData<typeof exampleLoader>;

// Action handler
export const exampleAction = createActionHandler({
  handlers: {
    POST: async ({ formData }) => {
      const name = formData.get('name')?.toString();
      await SomeApi.update({ name });
    },
  },
  getFormName: () => 'example',
  onSuccess: () => redirect(routes.root.home()),
});

// Component
export function ExampleRoute() {
  const { data } = useLoaderData<LoaderData>();

  return (
    <div className="space-y-8">
      <BackButton to={routes.root.home()} />
      <h1>{data.title}</h1>
      <SomeComponent data={data} />
    </div>
  );
}
```

## Migration Checklist

When refactoring an existing route:

- [ ] Apply `createLoader` or `createDeferredLoader` pattern
- [ ] Use `requireParam` for route parameter validation
- [ ] Extract type definitions (use `LoaderData` helper when possible)
- [ ] Identify sections >100 lines that can be extracted to components
- [ ] Extract complex form state to custom hooks
- [ ] Use shared components (`BackButton`, `PageHero`, etc.)
- [ ] Remove unused imports after extraction
- [ ] Run `/check` to verify no errors
- [ ] Test all functionality manually

## Related Files

- Core utilities: `apps/web/src/lib/utils/loader-factory.ts`
- Type helpers: `apps/web/src/lib/types/loader-types.ts`
- Param validators: `apps/web/src/lib/utils/param-validators.ts`
- Action handler: `apps/web/src/lib/utils/action-handler.ts`
- Shared components: `apps/web/src/components/shared/`

## Questions?

See `apps/web/GUIDELINES.md` for general code quality guidelines.
