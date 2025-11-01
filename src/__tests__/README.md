# Test Suite Documentation

## Overview

This test suite uses Vitest for unit testing. The tests are organized by component type and cover:

- **Utils**: HTML parser, error classes, route debugger
- **Services**: CartService, OrderService, ResourceService
- **Middleware**: Zod validator, validation schemas
- **API Clients**: (To be added)

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test -- --coverage
```

## Test Structure

```
src/__tests__/
├── setup.ts                    # Test setup (beforeAll, afterAll)
├── mocks.ts                     # Mock factories for dependencies
├── utils/
│   ├── html-parser.test.ts      # HTML parsing tests
│   └── errors.test.ts           # Error class tests
├── services/
│   ├── cart.service.test.ts     # Cart service tests
│   ├── order.service.test.ts     # Order service tests
│   └── resource.service.test.ts # Resource service tests
└── middleware/
    ├── zod-validator.test.ts    # Zod validator middleware tests
    └── validation.test.ts       # Validation schema tests
```

## Mock Strategy

We use TSyringe's dependency injection container for mocking. Each test:

1. Clears the container
2. Creates mock implementations
3. Registers mocks with the container
4. Resolves the service under test
5. Tests behavior with mocked dependencies

## Coverage Goals

- **Services**: 80%+ coverage
- **Utils**: 90%+ coverage
- **Middleware**: 100% coverage
- **Routes**: Integration tests (to be added)

## Adding New Tests

1. Create test file in appropriate directory
2. Import test utilities from `mocks.ts`
3. Use `container.clearInstances()` in `beforeEach`
4. Mock dependencies using factories
5. Test happy paths, error cases, and edge cases

