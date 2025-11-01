# Testing Guide

## Test Setup

We use **Vitest** for unit testing with the following features:
- TypeScript support
- Coverage reporting
- Watch mode
- UI mode for interactive testing

## Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test -- --coverage

# Run a specific test file
npm run test -- src/__tests__/utils/errors.test.ts
```

## Test Structure

Tests are located in `src/__tests__/` and organized by component type:

- **`utils/`** - Utility functions (HTML parser, errors, route debugger)
- **`services/`** - Business logic services (Cart, Order, Resource)
- **`middleware/`** - Hono middleware (Zod validator, validation schemas)

## Current Test Coverage

### ✅ Passing Tests (31 tests)

1. **Error Classes** (8 tests)
   - ApiError, NotFoundError, ValidationError
   - CsrfError, RateLimitError, DuplicateOrderError, NetworkError

2. **Validation Schemas** (14 tests)
   - addTaco validation
   - updateTacoQuantity validation
   - createOrder validation (with delivery/takeaway rules)
   - addExtra validation

3. **Zod Validator Middleware** (4 tests)
   - Successful validation
   - Error handling
   - Empty body handling
   - Validation details extraction

4. **HTML Parser** (5 tests)
   - Taco card parsing
   - Multiple cards parsing
   - Cart summary parsing
   - Error handling

### 🔧 Tests Needing Fixes (4 tests)

Service tests need proper DI container setup. These will be fixed next:
- CartService tests
- OrderService tests  
- ResourceService tests

## Adding New Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { YourService } from '../../services/your.service';

describe('YourService', () => {
  let service: YourService;
  
  beforeEach(() => {
    container.clearInstances();
    // Set up mocks
    service = container.resolve(YourService);
  });

  it('should do something', async () => {
    // Test implementation
    expect(result).toBeDefined();
  });
});
```

### Using Mocks

Mocks are available in `src/__tests__/mocks.ts`:

```typescript
import {
  createMockCartRepository,
  createMockTacosApiClient,
} from '../mocks';

const mockRepo = createMockCartRepository();
mockRepo.getCart.mockResolvedValue(mockData);
```

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Use Mocks**: Mock all external dependencies
3. **Test Edge Cases**: Test error conditions and boundaries
4. **Keep Tests Fast**: Avoid real network/database calls
5. **Clear Container**: Always clear DI container in `beforeEach`

## Coverage Goals

- **Services**: 80%+ coverage
- **Utils**: 90%+ coverage  
- **Middleware**: 100% coverage
- **Routes**: Integration tests (TBD)

## Continuous Integration

Tests should pass before merging:
- All unit tests must pass
- No TypeScript errors
- Coverage should not decrease

