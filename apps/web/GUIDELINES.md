# Frontend Web App Coding Guidelines

> **Project**: TacoCrew Web App
> **Framework**: React + Vite + React Router v7
> **Styling**: Tailwind CSS

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [UI-Kit Usage](#ui-kit-usage)
- [Component Guidelines](#component-guidelines)
- [State Management](#state-management)
- [Styling Patterns](#styling-patterns)
- [Forms](#forms)
- [Type Safety](#type-safety)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Internationalization](#internationalization)
- [Testing Guidelines](#testing-guidelines)
- [Code Review Checklist](#code-review-checklist)

---

## Architecture Overview

The web app follows a **feature-based architecture** with React Router for routing and data loading.

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # UI-kit re-exports
│   ├── shared/         # Shared business components
│   ├── orders/         # Domain-specific components
│   ├── profile/
│   └── notifications/
├── routes/             # React Router pages
│   ├── root.tsx
│   ├── orders.create.tsx
│   └── profile.settings.tsx
├── hooks/              # Custom React hooks
├── lib/                # API clients, utilities
│   ├── api/           # API client functions
│   ├── routes.ts      # Route definitions
│   └── session/       # Session management
├── utils/              # Pure utility functions
├── locales/           # i18n translations
├── types/             # TypeScript types
└── globals.css        # Global styles
```

### Data Flow

```
Route → Loader → Component → Hook → API Client → Backend
         ↓                     ↓
      Server State        Local State
```

**Rules**:
- ✅ Routes define loaders for data fetching
- ✅ Components are presentational
- ✅ Business logic in custom hooks
- ✅ API calls in lib/api clients
- ❌ No data fetching in components (use loaders/actions)
- ❌ No business logic in components (extract to hooks)

---

## UI-Kit Usage

### **CRITICAL RULE**: Always Use UI-Kit Components

**❌ DON'T** create custom basic UI components:

```typescript
// Bad - Don't recreate basic UI components
function CustomButton({ children, onClick }: ButtonProps) {
  return (
    <button
      className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Bad - Don't use native HTML for cards
function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow">
      <h3>{order.title}</h3>
      <p>{order.description}</p>
    </div>
  );
}
```

**✅ DO** use UI-kit components for all basic UI elements:

```typescript
import { Button, Card, CardHeader, CardContent, CardTitle } from '@/components/ui';

// Good - Use ui-kit Button
function CreateOrderButton() {
  return (
    <Button variant="default" color="brand" size="md">
      Create Order
    </Button>
  );
}

// Good - Use ui-kit Card
function OrderCard({ order }: OrderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{order.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{order.description}</p>
      </CardContent>
    </Card>
  );
}
```

### Import Pattern

**✅ DO** import from `@/components/ui`:

```typescript
// Good - Single import path
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from '@/components/ui';
```

**❌ DON'T** import directly from ui-kit package:

```typescript
// Bad - Direct package import
import { Button } from '@tacobot/ui-kit';
```

### Available UI-Kit Components

**Layout**:
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Divider`

**Form Controls**:
- `Button`
- `Input`, `Textarea`
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`
- `Checkbox`
- `DateTimePicker`
- `PhoneInput`
- `Label`
- `InputGroup`
- `SegmentedControl`

**Feedback**:
- `Alert`
- `Toast` / `Toaster`
- `Skeleton`
- `EmptyState`

**Overlays**:
- `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, etc.
- `Modal`, `ModalTrigger`, `ModalContent`
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`
- `Tooltip`, `TooltipTrigger`, `TooltipContent`

**Data Display**:
- `Avatar`
- `Badge`
- `StatusBadge`

### When to Create Custom Components

**✅ DO** create custom components for:
- **Business logic components** (e.g., `OrderSummary`, `TacoSelector`)
- **Composed components** (e.g., `UserAvatar` that wraps `Avatar` with user logic)
- **Domain-specific patterns** (e.g., `OrderCard` that uses multiple ui-kit components)

**Example of a good custom component**:

```typescript
import { Avatar, Badge, Card, CardHeader, CardContent } from '@/components/ui';

type TacoCardProps = {
  readonly taco: TacoOrder;
  readonly onEdit?: () => void;
};

// Good - Composed from ui-kit components
export function TacoCard({ taco, onEdit }: TacoCardProps) {
  return (
    <Card className="hover:-translate-y-0.5 transition-transform">
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar size="md" color="brandHero">
          <span className="text-xl">{taco.emoji}</span>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{taco.name}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {taco.meats.map((meat) => (
            <Badge key={meat.id} tone="warning" size="sm">
              {meat.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Extending UI-Kit Components

**✅ DO** use `className` prop to customize:

```typescript
import { Button, Card } from '@/components/ui';

// Good - Extend with className
<Button
  variant="default"
  color="brand"
  className="w-full shadow-lg"
>
  Submit Order
</Button>

<Card className="border-brand-400/50 bg-gradient-to-br from-brand-500/20">
  {/* Content */}
</Card>
```

**Why UI-Kit First?**
- ✅ Consistent design system
- ✅ Accessibility built-in (Radix UI)
- ✅ Reduced code duplication
- ✅ Easier to maintain and update styles globally

---

## Component Guidelines

### Prop Typing

**✅ DO** use `readonly` for all props:

```typescript
type OrderCardProps = {
  readonly orderId: string;
  readonly title: string;
  readonly items: readonly TacoItem[];
  readonly onEdit?: (orderId: string) => void;
  readonly className?: string;
};

export function OrderCard({ orderId, title, items, onEdit, className }: OrderCardProps) {
  // Component implementation
}
```

**✅ DO** extend HTML element types properly:

```typescript
import type { ComponentPropsWithoutRef } from 'react';

// Good - Extend HTML button props
type CustomButtonProps = ComponentPropsWithoutRef<'button'> & {
  readonly variant?: 'primary' | 'secondary';
  readonly loading?: boolean;
};

export function CustomButton({ variant = 'primary', loading, children, ...props }: CustomButtonProps) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}
```

### Forwarding Refs

**✅ DO** forward refs for form components:

```typescript
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

type CustomInputProps = ComponentPropsWithoutRef<'input'> & {
  readonly label?: string;
  readonly error?: string;
};

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <input ref={ref} {...props} />
        {error && <span className="text-rose-500">{error}</span>}
      </div>
    );
  }
);

CustomInput.displayName = 'CustomInput';
```

### Composition Patterns

**✅ DO** use composition for flexible components:

```typescript
// Good - Compound component pattern
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';

function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order #{order.id}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{order.description}</p>
        <Button>Edit Order</Button>
      </CardContent>
    </Card>
  );
}
```

---

## State Management

### Custom Hooks for Complex State

**❌ DON'T** put complex state logic in components:

```typescript
// Bad - State logic in component
function OrderForm() {
  const [size, setSize] = useState('medium');
  const [meats, setMeats] = useState<string[]>([]);
  const [sauces, setSauces] = useState<string[]>([]);

  const toggleMeat = (id: string) => {
    if (meats.includes(id)) {
      setMeats(meats.filter((m) => m !== id));
    } else {
      if (meats.length >= 3) return; // Max 3 meats
      setMeats([...meats, id]);
    }
  };

  // 50+ lines of state logic...

  return <form>{/* ... */}</form>;
}
```

**✅ DO** extract state logic into custom hooks:

```typescript
// Good - Custom hook for order form state
export function useOrderForm({ stock, initialOrder }: UseOrderFormProps) {
  const [size, setSize] = useState(initialOrder?.size ?? 'medium');
  const [meats, setMeats] = useState<string[]>(initialOrder?.meats ?? []);
  const [sauces, setSauces] = useState<string[]>(initialOrder?.sauces ?? []);

  const toggleSelection = (
    id: string,
    current: string[],
    setter: (value: string[]) => void,
    max?: number
  ) => {
    if (current.includes(id)) {
      setter(current.filter((item) => item !== id));
    } else {
      if (max && current.length >= max) return;
      setter([...current, id]);
    }
  };

  const toggleMeat = (id: string) => toggleSelection(id, meats, setMeats, 3);
  const toggleSauce = (id: string) => toggleSelection(id, sauces, setSauces, 2);

  // Auto-adjust selections when size changes
  useEffect(() => {
    const maxMeats = getSizeConfig(size).maxMeats;
    if (meats.length > maxMeats) {
      setMeats(meats.slice(0, maxMeats));
    }
  }, [size]);

  return {
    size,
    setSize,
    meats,
    sauces,
    toggleMeat,
    toggleSauce,
    // Computed values
    isValid: meats.length > 0 && sauces.length > 0,
    totalPrice: calculatePrice({ size, meats, sauces }),
  };
}

// Good - Clean component using hook
function OrderForm() {
  const { size, setSize, meats, toggleMeat, isValid, totalPrice } = useOrderForm({ stock });

  return (
    <form>
      <SizeSelector value={size} onChange={setSize} />
      <MeatSelector selected={meats} onToggle={toggleMeat} />
      <div>Total: ${totalPrice}</div>
      <Button disabled={!isValid}>Submit</Button>
    </form>
  );
}
```

### React Router Loaders for Server State

**✅ DO** use loaders for data fetching:

```typescript
// routes/orders.detail.tsx
import { type LoaderFunctionArgs } from 'react-router';
import { OrdersApi } from '@/lib/api/orders';

export async function orderDetailLoader({ params }: LoaderFunctionArgs) {
  const orderId = params.id;
  if (!orderId) throw new Response('Not Found', { status: 404 });

  const order = await OrdersApi.getOrderById(orderId);
  if (!order) throw new Response('Not Found', { status: 404 });

  return Response.json({ order });
}

// Component
export default function OrderDetail() {
  const { order } = useLoaderData<typeof orderDetailLoader>();

  return (
    <div>
      <h1>{order.title}</h1>
      <p>{order.description}</p>
    </div>
  );
}
```

### Session Store Pattern

**✅ DO** use custom store for auth state:

```typescript
// lib/session/store.ts
class SessionStore {
  private session: Session | null = null;
  private readonly listeners = new Set<() => void>();

  public getSession(): Session | null {
    return this.session;
  }

  public setSession(session: Session | null): void {
    this.session = session;
    this.emit();
    this.persistToStorage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private persistToStorage(): void {
    if (this.session) {
      localStorage.setItem('session', JSON.stringify(this.session));
    } else {
      localStorage.removeItem('session');
    }
  }
}

export const sessionStore = new SessionStore();

// Hook
export function useSession(): Session | null {
  const [session, setSession] = useState(() => sessionStore.getSession());

  useEffect(() => {
    return sessionStore.subscribe(() => {
      setSession(sessionStore.getSession());
    });
  }, []);

  return session;
}
```

---

## Styling Patterns

### Tailwind-First Approach

**❌ DON'T** use CSS modules or styled-components:

```typescript
// Bad - CSS modules
import styles from './OrderCard.module.css';

function OrderCard() {
  return <div className={styles.card}>...</div>;
}

// Bad - Styled components
const StyledCard = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  background: white;
`;
```

**✅ DO** use Tailwind utility classes:

```typescript
// Good - Tailwind utilities
function OrderCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {/* Content */}
    </div>
  );
}
```

### Class Merging with `cx()`

**✅ DO** use `cx()` utility for dynamic classes:

```typescript
import { cx } from '@/utils/cx';

type ButtonProps = {
  readonly variant?: 'primary' | 'secondary';
  readonly fullWidth?: boolean;
  readonly className?: string;
};

export function Button({ variant = 'primary', fullWidth, className }: ButtonProps) {
  return (
    <button
      className={cx(
        'rounded-lg px-4 py-2 font-semibold transition-colors',
        variant === 'primary' && 'bg-brand-500 text-white hover:bg-brand-600',
        variant === 'secondary' && 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        fullWidth && 'w-full',
        className // User classes override defaults
      )}
    >
      Submit
    </button>
  );
}
```

**Why `cx()` instead of template literals?**
- Automatically merges conflicting Tailwind classes
- `cx('bg-red-500', 'bg-blue-500')` → `'bg-blue-500'` (last wins)

### Design Tokens from UI-Kit

**✅ DO** use design tokens for consistency:

```typescript
import { radius, backgrounds, shadows } from '@tacobot/ui-kit';

// Good - Use design tokens
<Card className={cx(radius.md, backgrounds.card, shadows.sm)}>
  {/* Content */}
</Card>

// Good - Manual but consistent with design system
<Card className="rounded-2xl bg-slate-900/70 shadow-sm">
  {/* Content */}
</Card>
```

### Responsive Design

**✅ DO** use Tailwind responsive prefixes:

```typescript
<div className="
  flex flex-col gap-4
  md:flex-row md:gap-6
  lg:gap-8
">
  <aside className="w-full md:w-64 lg:w-80">
    {/* Sidebar */}
  </aside>
  <main className="flex-1">
    {/* Main content */}
  </main>
</div>
```

### Glass Morphism Pattern

**✅ DO** use glass morphism for modern UI:

```typescript
<Card className="
  border-white/10
  bg-slate-800/30
  backdrop-blur-sm
  shadow-xl
">
  {/* Content */}
</Card>
```

---

## Forms

### React Router Form Component

**✅ DO** use React Router `Form` for server actions:

```typescript
import { Form } from 'react-router';

export default function CreateOrder() {
  const { size, meats, sauces, toggleMeat } = useOrderForm({ stock });
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post" id="order-form">
      {/* Hidden inputs for form state */}
      <input type="hidden" name="size" value={size} />
      {meats.map((meatId) => (
        <input key={meatId} type="hidden" name="meats" value={meatId} />
      ))}

      {/* UI for selection */}
      <MeatSelector selected={meats} onToggle={toggleMeat} />

      <Button type="submit" loading={isSubmitting}>
        Create Order
      </Button>
    </Form>
  );
}
```

### Form Actions

**✅ DO** create action handlers:

```typescript
// routes/orders.create.tsx
import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

export async function orderCreateAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const size = formData.get('size')?.toString();
  const meats = formData.getAll('meats').map((v) => v.toString());
  const sauces = formData.getAll('sauces').map((v) => v.toString());

  // Validate
  if (!size || meats.length === 0) {
    return Response.json(
      { error: 'Invalid order data' },
      { status: 400 }
    );
  }

  // Create order
  await OrdersApi.createOrder({ size, meats, sauces });

  // Redirect to success page
  return redirect('/orders');
}
```

### Controlled Components

**✅ DO** use controlled components for immediate feedback:

```typescript
function OrderNoteInput() {
  const [note, setNote] = useState('');
  const maxLength = 500;
  const remaining = maxLength - note.length;

  return (
    <div>
      <Textarea
        name="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={maxLength}
        placeholder="Add a note to your order..."
      />
      <p className="text-sm text-slate-500">
        {remaining} characters remaining
      </p>
    </div>
  );
}
```

### Form Validation

**✅ DO** validate in custom hooks:

```typescript
export function useOrderValidation({ size, meats, sauces }: OrderFormState) {
  const hasTaco = size && meats.length > 0 && sauces.length > 0;

  const errors: string[] = [];

  if (!size) {
    errors.push('Please select a size');
  }

  if (meats.length === 0) {
    errors.push('Please select at least one meat');
  }

  if (meats.length > 3) {
    errors.push('Maximum 3 meats allowed');
  }

  if (sauces.length === 0) {
    errors.push('Please select at least one sauce');
  }

  const isValid = errors.length === 0;

  return { isValid, errors, canSubmit: isValid };
}

// Usage
function OrderForm() {
  const formState = useOrderForm({ stock });
  const validation = useOrderValidation(formState);

  return (
    <Form method="post">
      {/* Form fields */}

      {validation.errors.map((error) => (
        <Alert key={error} tone="error">
          {error}
        </Alert>
      ))}

      <Button type="submit" disabled={!validation.canSubmit}>
        Submit Order
      </Button>
    </Form>
  );
}
```

### File Upload Pattern

**✅ DO** use controlled file input with preview:

```typescript
function ImageUploader() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    await uploadImage(formData);
    toast.success('Image uploaded successfully');
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
      />

      {preview && (
        <div className="mt-4">
          <img src={preview} alt="Preview" className="h-32 w-32 rounded-lg object-cover" />
          <Button onClick={handleUpload}>Upload</Button>
        </div>
      )}
    </div>
  );
}
```

---

## Type Safety

### Loader/Action Data Typing

**✅ DO** properly type loader data:

```typescript
import { useLoaderData } from 'react-router';

export async function orderDetailLoader({ params }: LoaderFunctionArgs) {
  const order = await OrdersApi.getOrderById(params.id!);
  const stock = await StockApi.getStock();

  return Response.json({ order, stock });
}

// Good - Type from loader
export default function OrderDetail() {
  const { order, stock } = useLoaderData<typeof orderDetailLoader>();
  //     ^? Type: { order: Order; stock: Stock }

  return <div>{order.title}</div>;
}
```

### Generic Component Typing

**✅ DO** use generics for flexible components:

```typescript
type SelectOption<T> = {
  readonly value: T;
  readonly label: string;
};

type SelectProps<T> = {
  readonly options: readonly SelectOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
};

export function Select<T extends string>({ options, value, onChange }: SelectProps<T>) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Usage
<Select<'small' | 'medium' | 'large'>
  options={[
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ]}
  value={size}
  onChange={setSize}
/>
```

### Discriminated Unions

**✅ DO** use discriminated unions for variants:

```typescript
type LoadingState = { status: 'loading' };
type SuccessState = { status: 'success'; data: Order[] };
type ErrorState = { status: 'error'; error: string };

type OrderState = LoadingState | SuccessState | ErrorState;

function OrderList() {
  const [state, setState] = useState<OrderState>({ status: 'loading' });

  // TypeScript narrows the type based on status
  if (state.status === 'loading') {
    return <Skeleton />;
  }

  if (state.status === 'error') {
    return <Alert tone="error">{state.error}</Alert>;
  }

  // TypeScript knows state.data exists here
  return (
    <div>
      {state.data.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

---

## Performance

### Lazy Loading

**✅ DO** lazy load routes:

```typescript
import { lazy } from 'react';

const OrderDetail = lazy(() => import('./routes/orders.detail'));
const Profile = lazy(() => import('./routes/profile'));

// In router config
{
  path: '/orders/:id',
  Component: OrderDetail,
}
```

### Image Optimization

**✅ DO** optimize images:

```typescript
<img
  src="/images/taco.webp"
  alt="Taco"
  loading="lazy"
  className="h-32 w-32 object-cover"
  onError={(e) => {
    e.currentTarget.src = '/images/fallback.png';
  }}
/>
```

### Debouncing

**✅ DO** debounce expensive operations:

```typescript
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const [query, setQuery] = useState('');

  const debouncedSearch = useDebouncedCallback(
    async (searchTerm: string) => {
      const results = await searchOrders(searchTerm);
      setResults(results);
    },
    300 // 300ms delay
  );

  return (
    <Input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
      placeholder="Search orders..."
    />
  );
}
```

---

## Accessibility

### ARIA Attributes

**✅ DO** add proper ARIA attributes:

```typescript
<button
  aria-label="Close modal"
  aria-expanded={isOpen}
  onClick={onClose}
>
  <X size={20} />
</button>

<div role="alert" aria-live="polite">
  Order created successfully
</div>
```

### Keyboard Navigation

**✅ DO** handle keyboard events:

```typescript
function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return <div>{children}</div>;
}
```

---

## Internationalization

### i18next Usage

**✅ DO** use translation hook:

```typescript
import { useTranslation } from 'react-i18next';

function OrderCard({ order }: OrderCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardTitle>{t('orders.title')}</CardTitle>
      <p>{t('orders.total', { total: order.total })}</p>
      <Button>{t('orders.actions.edit')}</Button>
    </Card>
  );
}
```

---

## Testing Guidelines

### Component Testing

**✅ DO** test user interactions:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderForm } from './OrderForm';

describe('OrderForm', () => {
  it('should enable submit button when form is valid', () => {
    render(<OrderForm stock={mockStock} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();

    // Select size
    fireEvent.click(screen.getByRole('button', { name: /medium/i }));

    // Select meat
    fireEvent.click(screen.getByRole('checkbox', { name: /beef/i }));

    // Select sauce
    fireEvent.click(screen.getByRole('checkbox', { name: /spicy/i }));

    expect(submitButton).toBeEnabled();
  });

  it('should call onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    render(<OrderForm stock={mockStock} onSubmit={onSubmit} />);

    // Fill form...
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      size: 'medium',
      meats: ['beef'],
      sauces: ['spicy'],
    });
  });
});
```

---

## Code Review Checklist

### Route Patterns
- [ ] Loader uses `createLoader` or `createDeferredLoader` pattern
- [ ] Route parameters validated with `requireParam`
- [ ] Loader data typed with `LoaderData` helper or explicit type
- [ ] Actions use `createActionHandler` pattern
- [ ] Large routes (>400 LOC) broken into components
- [ ] Complex form state extracted to custom hooks
- [ ] Shared components used (`BackButton`, `PageHero`, etc.)

### UI-Kit Usage
- [ ] UI-kit components used for all basic UI elements
- [ ] No custom buttons, cards, inputs unless necessary
- [ ] Components imported from `@/components/ui`

### Component Quality
- [ ] Props marked as `readonly`
- [ ] TypeScript types are correct
- [ ] No `any` or `as` type assertions
- [ ] Refs forwarded for form components

### State Management
- [ ] Complex state logic extracted to custom hooks
- [ ] Data fetching in loaders, not components
- [ ] Local state only for UI concerns

### Styling
- [ ] Tailwind utilities used exclusively
- [ ] `cx()` used for dynamic classes
- [ ] Responsive design implemented
- [ ] Design system tokens used

### Accessibility
- [ ] ARIA attributes on interactive elements
- [ ] Keyboard navigation supported
- [ ] Focus management implemented

### Performance
- [ ] Images optimized and lazy loaded
- [ ] Expensive operations debounced
- [ ] No unnecessary re-renders

**See Also**:
- [Route Patterns Guide](./docs/ROUTE_PATTERNS.md) for routing best practices
- [UI-Kit Guidelines](../../packages/ui-kit/GUIDELINES.md) for component development
