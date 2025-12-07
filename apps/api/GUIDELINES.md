# Backend API Coding Guidelines

> **Project**: TacoCrew API
> **Framework**: Hono + Prisma + TypeScript
> **Architecture**: Clean Architecture with Dependency Injection

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Dependency Injection](#dependency-injection)
- [Type Safety - Branded IDs](#type-safety---branded-ids)
- [Code Organization](#code-organization)
- [Validation with Zod](#validation-with-zod)
- [Error Handling](#error-handling)
- [Database Patterns](#database-patterns)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [Testing Guidelines](#testing-guidelines)
- [Code Review Checklist](#code-review-checklist)

---

## Architecture Overview

The API follows **Clean Architecture** principles with clear separation of concerns.

### Layer Structure

```
src/
├── api/                  # HTTP Layer (routes, middleware, DTOs)
│   ├── routes/          # Route definitions
│   ├── middleware/      # Auth, validation, error handling
│   ├── schemas/         # Request/response schemas
│   └── dto/             # Data Transfer Objects
├── services/            # Business Logic Layer (use cases)
│   ├── user/
│   ├── order/
│   └── ...
├── infrastructure/      # External Concerns Layer
│   ├── database/       # Prisma setup
│   ├── repositories/   # Data access
│   └── api/            # External API clients
├── schemas/            # Domain Layer (domain models + validation)
└── shared/             # Cross-cutting Concerns
    ├── config/
    ├── types/
    └── utils/
```

### Data Flow

```
Request → Route → Middleware → Service → Repository → Database
                     ↓            ↓          ↓
                  Validation  Business    Data
                              Logic       Access
```

**Rules**:
- ✅ Routes should only handle HTTP concerns (request/response)
- ✅ Services contain business logic (use cases)
- ✅ Repositories abstract database access
- ✅ Schemas define domain models and validation
- ❌ No business logic in routes or repositories
- ❌ No database queries in services (use repositories)

---

## Dependency Injection

The API uses **TSyringe** for dependency injection.

### Setup

**Enable decorators in `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecororMetadata": true
  }
}
```

### Injectable Classes

**❌ DON'T** create dependencies manually:

```typescript
// Bad - Manual instantiation creates tight coupling
export class CreateOrderService {
  private orderRepository = new OrderRepository();
  private userRepository = new UserRepository();

  async execute(data: CreateOrderData) {
    // ...
  }
}
```

**✅ DO** use `@injectable()` decorator and `inject()` helper:

```typescript
import { injectable } from 'tsyringe';
import { inject } from '@/shared/utils/inject.utils';

// Good - Dependency injection
@injectable()
export class CreateOrderService {
  private readonly orderRepository = inject(OrderRepository);
  private readonly userRepository = inject(UserRepository);
  private readonly notificationService = inject(NotificationService);

  async execute(data: CreateOrderData): Promise<Order> {
    // Business logic here
    const user = await this.userRepository.findById(data.userId);
    const order = await this.orderRepository.create(data);
    await this.notificationService.sendOrderConfirmation(order);
    return order;
  }
}
```

### Circular Dependencies

**✅ DO** use `injectLazy()` for circular dependencies:

```typescript
import { injectLazy } from '@/shared/utils/inject.utils';

@injectable()
export class OrderService {
  // Lazy injection breaks circular dependency
  private readonly getUserOrders = injectLazy(() => inject(UserOrderService));

  async execute() {
    const userOrderService = this.getUserOrders();
    // Use service
  }
}
```

### Repository Pattern

**All repositories should be injectable**:

```typescript
@injectable()
export class OrderRepository {
  private readonly prisma = inject(PrismaService);

  async findById(id: OrderId): Promise<Order | null> {
    const data = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!data) return null;
    return createOrderFromDb(data);
  }

  async create(data: CreateOrderData): Promise<Order> {
    const created = await this.prisma.order.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
    });
    return createOrderFromDb(created);
  }
}
```

**Why Dependency Injection?**
- **Testability**: Easy to mock dependencies in tests
- **Loose coupling**: Services don't depend on concrete implementations
- **Single instance**: Repositories and services are singletons by default
- **Flexibility**: Easy to swap implementations

---

## Type Safety - Branded IDs

**CRITICAL RULE**: All entity IDs must be typed using branded types to prevent passing wrong IDs.

### Branded ID System

**Brand type definition** (`shared/utils/branded-ids.utils.ts`):

```typescript
// Brand helper for creating unique types from primitives
export type Brand<T, B> = T & { __brand: B };

// Generic ID type
export type Id<T extends string = string> = Brand<string, T>;

// Zod schema factory for UUID validation
export function zId<T extends Id>() {
  return z.string().uuid().transform((val) => val as T);
}
```

### Defining Entity IDs

**✅ DO** create branded ID types for all entities:

```typescript
// schemas/user.schema.ts
export type UserId = Id<'User'>;
export const UserIdSchema = zId<UserId>();

// schemas/order.schema.ts
export type OrderId = Id<'Order'>;
export const OrderIdSchema = zId<OrderId>();

// schemas/taco.schema.ts
export type TacoId = Id<'Taco'>;
export const TacoIdSchema = zId<TacoId>();
```

### Using Branded IDs

**❌ DON'T** use plain strings for entity IDs:

```typescript
// Bad - No type safety
async function getOrder(orderId: string, userId: string) {
  // Easy to accidentally swap parameters!
  return orderRepository.findByUser(orderId, userId); // Wrong order!
}
```

**✅ DO** use branded types for compile-time safety:

```typescript
// Good - Compiler prevents ID confusion
async function getOrder(orderId: OrderId, userId: UserId): Promise<Order> {
  return orderRepository.findByUser(userId, orderId); // Correct!
}

// This would cause a TypeScript error:
getOrder(userId, orderId); // Error: Type 'UserId' is not assignable to type 'OrderId'
```

### Validating IDs

**✅ DO** validate IDs from external sources:

```typescript
// Good - Parse and validate request params
export async function getOrderRoute(c: Context) {
  const { id } = c.req.param();

  // Validates UUID format and creates branded type
  const orderId = OrderIdSchema.parse(id);

  const order = await orderService.getById(orderId);
  return c.json(order);
}
```

**Benefits**:
- ✅ Compile-time prevention of ID mix-ups
- ✅ Runtime UUID validation via Zod
- ✅ Self-documenting function signatures
- ✅ Impossible to accidentally pass wrong ID type

---

## Code Organization

### Service Naming Convention

**Format**: `{verb}-{entity}.service.ts`

**✅ DO** name services by use case:

```
services/
├── user/
│   ├── create-user.service.ts
│   ├── update-user-profile.service.ts
│   └── delete-user.service.ts
├── order/
│   ├── create-order.service.ts
│   ├── submit-order.service.ts
│   ├── cancel-order.service.ts
│   └── get-user-orders.service.ts
```

**✅ DO** use descriptive class names:

```typescript
// Good - Clear, action-oriented names
export class CreateOrderService {}
export class SubmitOrderService {}
export class CancelOrderService {}

// Avoid - Generic CRUD names
export class OrderService {} // Too vague
export class OrderCRUD {}    // Not domain-focused
```

### Repository Naming

**Format**: `{entity}.repository.ts`

```
infrastructure/repositories/
├── user.repository.ts
├── order.repository.ts
├── group-order.repository.ts
└── user-order.repository.ts
```

### Schema Organization

**Domain schemas** contain:
1. Zod schemas for validation
2. TypeScript types derived from schemas
3. Domain logic functions

**Example structure**:

```typescript
// schemas/order.schema.ts

// 1. Zod schemas
export const OrderStatusSchema = z.enum(['draft', 'submitted', 'completed', 'cancelled']);

export const OrderSchema = z.object({
  id: zId<OrderId>(),
  userId: zId<UserId>(),
  status: OrderStatusSchema,
  items: z.array(OrderItemSchema),
  total: z.number().positive(),
  createdAt: z.date(),
});

// 2. TypeScript types
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type Order = z.infer<typeof OrderSchema>;

// 3. Domain logic functions
export function canCancelOrder(order: Order): boolean {
  return order.status === 'draft' || order.status === 'submitted';
}

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// 4. Type guards
export function isOrderItem(value: unknown): value is OrderItem {
  return OrderItemSchema.safeParse(value).success;
}
```

**Why?**
- Domain logic lives with domain models
- Single source of truth for business rules
- Easy to find and maintain domain logic

---

## Validation with Zod

All validation uses **Zod** for type-safe runtime validation.

### Request Validation

**✅ DO** define schemas for all requests:

```typescript
// api/schemas/create-order.schema.ts
export const CreateOrderRequestSchema = z.object({
  items: z.array(
    z.object({
      tacoId: zId<TacoId>(),
      quantity: z.number().int().min(1).max(10),
    })
  ).min(1),
  note: z.string().max(500).optional(),
  deliveryTime: z.string().datetime(),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
```

### Route Validation with Hono + Zod OpenAPI

**✅ DO** use Zod OpenAPI for automatic validation:

```typescript
import { createRoute, z } from '@hono/zod-openapi';

const createOrderRoute = createRoute({
  method: 'post',
  path: '/orders',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateOrderRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: OrderResponseSchema,
        },
      },
      description: 'Order created successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorSchema,
        },
      },
      description: 'Validation error',
    },
  },
});

app.openapi(createOrderRoute, async (c) => {
  // Request is already validated!
  const body = c.req.valid('json'); // Type: CreateOrderRequest

  const order = await createOrderService.execute(body);
  return c.json(order, 201);
});
```

### Middleware Validation

**✅ DO** use validation middleware for custom validation:

```typescript
import { zodValidator } from '@/api/middleware/zod-validator.middleware';

app.post('/orders', zodValidator(CreateOrderRequestSchema), async (c) => {
  const body = c.get('body'); // Already validated and typed
  // ...
});
```

### Parse, Don't Validate

**❌ DON'T** just validate data:

```typescript
// Bad - Validation without transformation
if (typeof data.date === 'string') {
  const date = new Date(data.date); // Manual transformation
}
```

**✅ DO** parse and transform data:

```typescript
// Good - Parse transforms data
const OrderSchema = z.object({
  date: z.string().datetime().transform((str) => new Date(str)),
  price: z.string().transform((str) => Number.parseFloat(str)),
});

const order = OrderSchema.parse(data);
// order.date is Date, order.price is number
```

---

## Error Handling

### Custom Error Classes

**✅ DO** use custom error classes with rich context:

```typescript
// shared/utils/errors.utils.ts

export class ApiError extends Error {
  public readonly id: string;
  public readonly key: string;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>;

  constructor(options: {
    message: string;
    key: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.id = crypto.randomUUID();
    this.key = options.key;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details ?? {};
  }
}

export class ValidationError extends ApiError {
  constructor(details: { message: string; fields?: Record<string, string> }) {
    super({
      message: details.message,
      key: 'errors.validation.failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: { fields: details.fields },
    });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(details: { resource: string; id?: string }) {
    super({
      message: `${details.resource} not found`,
      key: 'errors.notFound',
      code: 'NOT_FOUND',
      statusCode: 404,
      details,
    });
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(details?: { message?: string }) {
    super({
      message: details?.message ?? 'Unauthorized',
      key: 'errors.unauthorized',
      code: 'UNAUTHORIZED',
      statusCode: 401,
      details: details ?? {},
    });
    this.name = 'UnauthorizedError';
  }
}
```

### Error Middleware

**✅ DO** use centralized error handler:

```typescript
// api/middleware/error-handler.middleware.ts

export function errorHandler(err: Error, c: Context) {
  // Log all errors
  console.error('Error:', {
    id: err instanceof ApiError ? err.id : undefined,
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  // Handle known errors
  if (err instanceof ApiError) {
    return c.json(
      {
        error: {
          id: err.id,
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.statusCode
    );
  }

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { issues: err.errors },
        },
      },
      400
    );
  }

  // Unknown errors - don't leak details
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    500
  );
}

app.onError(errorHandler);
```

### Throwing Errors in Services

**✅ DO** throw errors for exceptional conditions:

```typescript
@injectable()
export class CreateOrderService {
  async execute(data: CreateOrderData, userId: UserId): Promise<Order> {
    // Validation errors
    if (data.items.length === 0) {
      throw new ValidationError({ message: 'Order must have at least one item' });
    }

    // Not found errors
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError({ resource: 'User', id: userId });
    }

    // Business rule violations
    const groupOrder = await this.groupOrderRepository.findById(data.groupOrderId);
    if (!canAcceptOrders(groupOrder)) {
      throw new ValidationError({
        message: 'Group order is not accepting orders',
        fields: { groupOrderId: 'Order period has ended' },
      });
    }

    return this.orderRepository.create(data);
  }
}
```

**Why Custom Errors?**
- ✅ Consistent error responses
- ✅ Error tracking with unique IDs
- ✅ i18n support with error keys
- ✅ Rich context for debugging

---

## Database Patterns

### Prisma Usage

**✅ DO** inject PrismaService in repositories:

```typescript
@injectable()
export class PrismaService {
  public readonly client: PrismaClient;

  constructor() {
    this.client = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  async disconnect() {
    await this.client.$disconnect();
  }
}

@injectable()
export class OrderRepository {
  private readonly prisma = inject(PrismaService);

  async findById(id: OrderId): Promise<Order | null> {
    const data = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: { taco: true },
        },
      },
    });

    if (!data) return null;
    return createOrderFromDb(data);
  }
}
```

### Database-to-Domain Mapping

**✅ DO** create mapper functions:

```typescript
// schemas/order.schema.ts

// Database schema type (from Prisma)
type OrderFromDb = {
  id: string;
  userId: string;
  status: string;
  total: number;
  createdAt: Date;
  items: Array<{
    id: string;
    tacoId: string;
    quantity: number;
  }>;
};

// Zod schema for validation
const OrderFromDbSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.string(),
  total: z.number(),
  createdAt: z.date(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      tacoId: z.string().uuid(),
      quantity: z.number(),
    })
  ),
});

// Mapper function
export function createOrderFromDb(data: unknown): Order {
  // Validate and transform
  const validated = OrderFromDbSchema.parse(data);

  return {
    id: OrderIdSchema.parse(validated.id),
    userId: UserIdSchema.parse(validated.userId),
    status: OrderStatusSchema.parse(validated.status),
    total: validated.total,
    createdAt: validated.createdAt,
    items: validated.items.map((item) => ({
      id: OrderItemIdSchema.parse(item.id),
      tacoId: TacoIdSchema.parse(item.tacoId),
      quantity: item.quantity,
    })),
  };
}
```

### Transaction Handling

**✅ DO** use Prisma transactions for multi-step operations:

```typescript
@injectable()
export class CreateOrderService {
  async execute(data: CreateOrderData): Promise<Order> {
    return this.prisma.client.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId: data.userId,
          status: 'draft',
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          orderId: order.id,
          tacoId: item.tacoId,
          quantity: item.quantity,
        })),
      });

      // Update stock
      for (const item of data.items) {
        await tx.stock.update({
          where: { tacoId: item.tacoId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return createOrderFromDb(order);
    });
  }
}
```

---

## API Documentation

### OpenAPI with Zod

**✅ DO** use `@hono/zod-openapi` for automatic API docs:

```typescript
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

const app = new OpenAPIHono();

// Define route with OpenAPI schema
const getOrderRoute = createRoute({
  method: 'get',
  path: '/orders/{id}',
  request: {
    params: z.object({
      id: OrderIdSchema.openapi({
        description: 'Order ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OrderResponseSchema.openapi({
            description: 'Order details',
          }),
        },
      },
      description: 'Order retrieved successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: NotFoundErrorSchema,
        },
      },
      description: 'Order not found',
    },
  },
  tags: ['Orders'],
  summary: 'Get order by ID',
  description: 'Retrieves a single order by its unique identifier',
});

app.openapi(getOrderRoute, async (c) => {
  const { id } = c.req.valid('param');
  const order = await orderService.getById(id);
  return c.json(order);
});

// Serve OpenAPI spec
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'TacoCrew API',
    version: '0.2512.1',
  },
});
```

**Access docs at**:
- `/openapi.json` - OpenAPI specification
- `/docs` - Swagger UI (if configured)

---

## Authentication & Authorization

### Better Auth Integration

**✅ DO** use Better Auth for session management:

```typescript
// auth.ts
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: prismaAdapter(prisma),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

### Auth Middleware

**✅ DO** protect routes with auth middleware:

```typescript
// middleware/auth.middleware.ts

export async function requireAuth(c: Context, next: Next) {
  // Check session
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    throw new UnauthorizedError({ message: 'Authentication required' });
  }

  // Attach user to context
  c.set('userId', session.user.id as UserId);
  c.set('user', session.user);

  await next();
}

// Usage
app.get('/orders', requireAuth, async (c) => {
  const userId = c.get('userId'); // Type: UserId
  const orders = await orderService.getByUserId(userId);
  return c.json(orders);
});
```

### Authorization Checks

**✅ DO** check permissions in services:

```typescript
@injectable()
export class DeleteOrderService {
  async execute(orderId: OrderId, userId: UserId): Promise<void> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError({ resource: 'Order', id: orderId });
    }

    // Authorization check
    if (order.userId !== userId) {
      throw new ForbiddenError({
        message: 'You are not authorized to delete this order',
      });
    }

    await this.orderRepository.delete(orderId);
  }
}
```

---

## Testing Guidelines

### Test Structure

**Test files**: `*.test.ts` or `*.spec.ts`

**Location**: Co-located with source files or in `__tests__/` directories

```
services/
├── order/
│   ├── create-order.service.ts
│   ├── create-order.service.test.ts  # Co-located
│   └── __tests__/
│       └── helpers.ts
```

### Vitest Configuration

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    setupFiles: ['src/shared/utils/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        '*.test.ts',
      ],
    },
  },
});
```

### Test Template

**✅ DO** follow this structure:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateOrderService } from './create-order.service';
import type { OrderRepository } from '@/infrastructure/repositories/order.repository';
import type { UserRepository } from '@/infrastructure/repositories/user.repository';

describe('CreateOrderService', () => {
  let service: CreateOrderService;
  let mockOrderRepository: OrderRepository;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    // Create mocks
    mockOrderRepository = {
      create: vi.fn(),
      findById: vi.fn(),
    } as any;

    mockUserRepository = {
      findById: vi.fn(),
    } as any;

    // Inject mocks
    service = new CreateOrderService();
    (service as any).orderRepository = mockOrderRepository;
    (service as any).userRepository = mockUserRepository;
  });

  describe('execute', () => {
    it('should create an order successfully', async () => {
      // Arrange
      const userId = 'user-123' as UserId;
      const orderData = {
        items: [{ tacoId: 'taco-1' as TacoId, quantity: 2 }],
      };

      const mockUser = { id: userId, name: 'Test User' };
      const mockOrder = { id: 'order-1' as OrderId, ...orderData };

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(mockOrderRepository.create).mockResolvedValue(mockOrder);

      // Act
      const result = await service.execute(orderData, userId);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockOrderRepository.create).toHaveBeenCalledWith(orderData);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent' as UserId;
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.execute({ items: [] }, userId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when items array is empty', async () => {
      // Arrange
      const userId = 'user-123' as UserId;
      const mockUser = { id: userId, name: 'Test User' };
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.execute({ items: [] }, userId)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### Mocking with Dependency Injection

**✅ DO** leverage DI for easy mocking:

```typescript
// Test helper to create service with mocks
function createServiceWithMocks() {
  const mocks = {
    orderRepository: {
      create: vi.fn(),
      findById: vi.fn(),
    } as any as OrderRepository,
    userRepository: {
      findById: vi.fn(),
    } as any as UserRepository,
  };

  const service = new CreateOrderService();
  (service as any).orderRepository = mocks.orderRepository;
  (service as any).userRepository = mocks.userRepository;

  return { service, mocks };
}

// Usage
it('should work', async () => {
  const { service, mocks } = createServiceWithMocks();
  mocks.userRepository.findById.mockResolvedValue(mockUser);

  await service.execute(data, userId);
});
```

### Repository Testing

**✅ DO** test repositories with real database (test database):

```typescript
describe('OrderRepository', () => {
  let repository: OrderRepository;
  let prisma: PrismaClient;

  beforeEach(async () => {
    // Use test database
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });

    repository = new OrderRepository();
    (repository as any).prisma = { client: prisma };

    // Clean database
    await prisma.order.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should create and retrieve an order', async () => {
    const orderData = {
      userId: 'user-1' as UserId,
      status: 'draft' as OrderStatus,
      total: 25.5,
    };

    const created = await repository.create(orderData);
    const retrieved = await repository.findById(created.id);

    expect(retrieved).toEqual(created);
  });
});
```

### Coverage Expectations

**Target coverage**:
- Services: 90%+ (critical business logic)
- Repositories: 80%+
- Utilities: 90%+
- Routes: 70%+ (integration tests preferred)

**Run coverage**:
```bash
bun test --coverage
```

---

## Code Review Checklist

### Architecture
- [ ] Clean architecture layers respected (no business logic in routes)
- [ ] Services use dependency injection (`@injectable()`)
- [ ] Repositories used for all database access
- [ ] Domain logic in schema files, not scattered

### Type Safety
- [ ] All entity IDs use branded types (UserId, OrderId, etc.)
- [ ] No `any` or `as` type assertions
- [ ] Zod schemas for all request/response data
- [ ] Database mappers validate and transform data

### Error Handling
- [ ] Custom error classes used
- [ ] Errors include context and error codes
- [ ] Error middleware catches all errors
- [ ] No sensitive data leaked in error responses

### Validation
- [ ] All inputs validated with Zod
- [ ] OpenAPI schemas defined for routes
- [ ] Business rules validated in services
- [ ] Type guards used for unknown data

### Testing
- [ ] Services have unit tests
- [ ] Edge cases covered
- [ ] Mocks used for dependencies
- [ ] Integration tests for critical paths
- [ ] Tests are passing and coverage is adequate

### Security
- [ ] Authentication required for protected routes
- [ ] Authorization checks in services
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] Input validation prevents XSS

### Documentation
- [ ] OpenAPI documentation complete
- [ ] Complex business logic commented
- [ ] README updated if architecture changed

---

## Resources

- [TSyringe Documentation](https://github.com/microsoft/tsyringe)
- [Zod Documentation](https://zod.dev/)
- [Hono Documentation](https://hono.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth Documentation](https://www.better-auth.com/)
- [Vitest Documentation](https://vitest.dev/)

---

**Next**: See [Web App Guidelines](../web/GUIDELINES.md) for frontend conventions.
