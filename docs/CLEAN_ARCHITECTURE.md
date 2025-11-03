# Clean Architecture Implementation

This document describes the clean architecture implementation of the Tacos Ordering API.

## Architecture Layers

### 1. Domain Layer (`src/domain/`)
The core business logic layer - independent of frameworks and external concerns.

#### Entities (`src/domain/entities/`)
- `User` - User domain entity
- `GroupOrder` - Group order domain entity
- `UserOrder` - User order domain entity
- `Order` - Order domain entity

Entities contain:
- Business logic and domain rules
- Validation methods (e.g., `isOpenForOrders()`, `canBeModified()`)
- No infrastructure dependencies

#### Repository Interfaces (`src/domain/repositories/`)
- `IUserRepository` - Contract for user persistence
- `IGroupOrderRepository` - Contract for group order persistence
- `IUserOrderRepository` - Contract for user order persistence

These are interfaces only - implementations are in the infrastructure layer.

### 2. Application Layer (`src/application/`)
Contains use cases (business logic) and application-specific concerns.

#### Use Cases (`src/application/use-cases/`)
Each use case represents a single business operation:
- `CreateUserUseCase` - Create or get user
- `CreateGroupOrderUseCase` - Create a new group order
- `GetGroupOrderUseCase` - Get group order by ID
- `GetGroupOrderWithUserOrdersUseCase` - Get group order with all user orders
- `CreateUserOrderUseCase` - Create or update user order
- `GetUserOrderUseCase` - Get user order
- `SubmitUserOrderUseCase` - Submit user order
- `DeleteUserOrderUseCase` - Delete user order
- `GetUserOrdersHistoryUseCase` - Get user's order history

Use cases:
- Contain business logic and orchestration
- Depend only on domain interfaces (not implementations)
- Are framework-agnostic

#### DTOs (`src/application/dtos/`)
Data Transfer Objects for API communication:
- `CreateUserRequestDto`, `UserResponseDto`
- `CreateGroupOrderRequestDto`, `GroupOrderResponseDto`
- `CreateUserOrderRequestDto`, `UserOrderResponseDto`

#### Mappers (`src/application/mappers/`)
Convert between domain entities and DTOs:
- `UserMapper`
- `GroupOrderMapper`
- `UserOrderMapper`

### 3. Infrastructure Layer (`src/infrastructure/`)
Handles external concerns: database, HTTP, external APIs.

#### Repository Adapters (`src/infrastructure/repositories/`)
Implement domain repository interfaces:
- `UserRepositoryAdapter` - Implements `IUserRepository` using Prisma
- `GroupOrderRepositoryAdapter` - Implements `IGroupOrderRepository` using Prisma
- `UserOrderRepositoryAdapter` - Implements `IUserOrderRepository` using Prisma

These adapters:
- Map database models to domain entities
- Handle infrastructure-specific concerns
- Isolate domain from database details

#### Dependency Injection (`src/infrastructure/dependency-injection.ts`)
Registers domain interfaces with their implementations using tsyringe.

### 4. Presentation Layer (`src/hono/`)
HTTP handlers and routing.

#### Routes (`src/hono/routes/`)
- Use use cases for business logic
- Use mappers to convert entities to DTOs
- Handle HTTP-specific concerns (validation, status codes, etc.)

## Benefits of This Architecture

1. **Testability**: Domain logic is isolated and easily testable
2. **Maintainability**: Clear separation of concerns
3. **Flexibility**: Easy to swap implementations (e.g., database, framework)
4. **Independence**: Domain logic is framework-agnostic
5. **Scalability**: Easy to add new features without affecting existing code

## Dependency Flow

```
Presentation (Hono Routes)
    ↓
Application (Use Cases)
    ↓
Domain (Entities & Interfaces)
    ↑
Infrastructure (Repository Adapters)
```

**Rule**: Dependencies point inward. Inner layers never depend on outer layers.

## Example: Creating a Group Order

1. **Route** (`group-order.routes.ts`) receives HTTP request
2. **Use Case** (`CreateGroupOrderUseCase`) validates and orchestrates
3. **Repository Interface** (`IGroupOrderRepository`) defines contract
4. **Repository Adapter** (`GroupOrderRepositoryAdapter`) implements with Prisma
5. **Domain Entity** (`GroupOrder`) contains business rules
6. **Mapper** (`GroupOrderMapper`) converts entity to DTO
7. **Route** returns HTTP response

## Migration Path

Existing services are gradually being refactored:
- Old services remain for backward compatibility
- New features use clean architecture
- Services are being converted to use cases

## Next Steps

1. Complete migration of all services to use cases
2. Add domain events for cross-cutting concerns
3. Create domain services for complex business rules
4. Add unit tests for domain entities and use cases
