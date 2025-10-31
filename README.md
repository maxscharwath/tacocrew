# Tacos API Integration

A fully typed TypeScript application for integrating with the tacos ordering system backend API. This application provides both a RESTful Web API and Slack bot integration for managing tacos orders.

## Features

- ? **Fully Typed**: Complete TypeScript type definitions for all API models
- ? **Clean Architecture**: Service layer, API client, and integration separation
- ? **Modern Stack**: Express.js, Slack Bolt, Winston logging
- ? **RESTful API**: Clean REST endpoints wrapping legacy PHP backend
- ? **Slack Bot**: Interactive Slack commands for order management
- ? **Error Handling**: Comprehensive error handling with custom error types
- ? **CSRF Management**: Automatic CSRF token refresh and management
- ? **Well Documented**: Inline documentation and type annotations

## Project Structure

```
src/
??? api/                  # API layer
?   ??? client.ts        # Backend API client wrapper
?   ??? web-server.ts    # Express REST API server
??? services/            # Business logic layer
?   ??? tacos-api.service.ts
??? integrations/        # External integrations
?   ??? slack-bot.service.ts
??? types/               # TypeScript type definitions
?   ??? models.ts        # Core data models
?   ??? config.ts        # Configuration types
?   ??? errors.ts        # Custom error classes
?   ??? index.ts         # Barrel exports
??? utils/               # Utilities
?   ??? config.ts        # Configuration management
?   ??? logger.ts        # Winston logger setup
??? index.ts             # Application entry point
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   Edit `.env` file with your configuration:
   ```env
   BACKEND_API_BASE_URL=https://your-tacos-api.com
   PORT=3000
   NODE_ENV=development
   
   # Optional: Slack Bot Configuration
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-token
   ```

## Usage

### Development

```bash
npm run dev
```

This starts the application with hot-reload using `tsx watch`.

### Production

```bash
npm run build
npm start
```

### Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Start development server with hot-reload
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Type check without building
- `npm test` - Run tests

## API Endpoints

The Web API server provides RESTful endpoints at `/api/v1`:

### Resources
- `GET /api/v1/resources/stock` - Get stock availability

### Cart
- `GET /api/v1/cart` - Get current cart
- `POST /api/v1/cart/tacos` - Add taco to cart
- `GET /api/v1/cart/tacos/:id` - Get taco details
- `PUT /api/v1/cart/tacos/:id` - Update taco
- `PATCH /api/v1/cart/tacos/:id/quantity` - Update taco quantity
- `DELETE /api/v1/cart/tacos/:id` - Delete taco

### Orders
- `POST /api/v1/orders` - Submit order
- `GET /api/v1/orders/:id/status` - Get order status
- `POST /api/v1/orders/:id/restore` - Restore order to cart

### Delivery
- `GET /api/v1/delivery/demand/:time` - Check delivery demand

### Group Orders
- `POST /api/v1/group-orders` - Create a new group order
- `GET /api/v1/group-orders` - Get all active group orders
- `GET /api/v1/group-orders/:id` - Get a specific group order
- `POST /api/v1/group-orders/:id/items` - Add an item to a group order
- `DELETE /api/v1/group-orders/:id/items/:itemId` - Remove an item from a group order
- `POST /api/v1/group-orders/:id/close` - Close a group order (stop accepting new items)
- `POST /api/v1/group-orders/:id/submit` - Submit a group order

### Health
- `GET /api/v1/health` - Health check

## Slack Bot Commands

If Slack bot is configured, the following commands are available:

- `/tacos` - Show tacos ordering system info
- `/tacos-menu` - View menu
- `/tacos-cart` - View current cart
- `/tacos-order` - Place order
- `/tacos-group-start [minutes]` - Start a group order (default: 30 minutes)
- `/tacos-group-view <order-id>` - View a group order
- `/tacos-group-list` - List all active group orders

## Example Usage

### Using the API Client

```typescript
import { getTacosApiService } from '@/services/tacos-api.service';

const service = getTacosApiService();

// Get stock availability
const stock = await service.getStockAvailability();

// Add taco to cart
const taco = await service.addTacoToCart({
  size: 'tacos_XL',
  meats: [
    { slug: 'viande_hachee', name: 'Viande Hach?e', quantity: 2 }
  ],
  sauces: [
    { slug: 'harissa', name: 'Harissa' }
  ],
  garnitures: [
    { slug: 'salade', name: 'Salade' }
  ],
  note: 'Pas trop ?pic?'
});

// Submit order
const order = await service.submitOrder(
  {
    name: 'John Doe',
    phone: '+41791234567'
  },
  {
    type: 'livraison',
    address: '123 Rue Example, 1000 Lausanne',
    requestedFor: '15:00'
  }
);
```

### Using the REST API

```bash
# Get cart
curl http://localhost:3000/api/v1/cart

# Add taco to cart
curl -X POST http://localhost:3000/api/v1/cart/tacos \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [{"slug": "viande_hachee", "name": "Viande Hach?e", "quantity": 2}],
    "sauces": [{"slug": "harissa", "name": "Harissa"}],
    "garnitures": [{"slug": "salade", "name": "Salade"}]
  }'

# Submit order
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "John Doe",
      "phone": "+41791234567"
    },
    "delivery": {
      "type": "livraison",
      "address": "123 Rue Example",
      "requestedFor": "15:00"
    }
  }'

# Create a group order
curl -X POST http://localhost:3000/api/v1/group-orders \
  -H "Content-Type: application/json" \
  -d '{
    "createdBy": {
      "id": "user123",
      "name": "John Doe"
    },
    "expiresInMinutes": 30
  }'

# Add item to group order
curl -X POST http://localhost:3000/api/v1/group-orders/{order-id}/items \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user456",
    "userName": "Jane Smith",
    "taco": {
      "size": "tacos_XL",
      "meats": [{"slug": "viande_hachee", "name": "Viande Hach?e", "quantity": 2}],
      "sauces": [{"slug": "harissa", "name": "Harissa"}],
      "garnitures": [{"slug": "salade", "name": "Salade"}]
    },
    "quantity": 1
  }'

# Submit group order
curl -X POST http://localhost:3000/api/v1/group-orders/{order-id}/submit \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "John Doe",
      "phone": "+41791234567"
    },
    "delivery": {
      "type": "livraison",
      "address": "123 Rue Example",
      "requestedFor": "15:00"
    }
  }'
```

## Type Definitions

All types are defined in `src/types/`:

- `TacoSize` - Available taco sizes
- `TacoConfig` - Taco configuration
- `CartTaco` - Taco in cart
- `Cart` - Cart contents
- `Order` - Order structure
- `OrderStatus` - Order status lifecycle
- `StockAvailability` - Stock information
- And more...

## Error Handling

The application uses custom error classes:

- `ApiClientError` - Base API error
- `CsrfTokenError` - CSRF token issues
- `RateLimitError` - Rate limit exceeded
- `ValidationError` - Validation errors
- `NotFoundError` - Resource not found
- `DuplicateOrderError` - Duplicate order

All errors are properly typed and include status codes and error details.

## Configuration

Configuration is managed through environment variables and loaded via `src/utils/config.ts`. The configuration is validated on startup and provides type-safe access throughout the application.

## Logging

Logging is handled by Winston and configured in `src/utils/logger.ts`. Log levels and formats can be configured via environment variables.

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Building

```bash
npm run build
```

## Contributing

1. Follow TypeScript best practices
2. Maintain type safety - avoid `any` types
3. Add JSDoc comments for public APIs
4. Run linter and type checker before committing
5. Write tests for new features

## License

MIT

## Documentation

For detailed API documentation, see:
- `API_DOCUMENTATION.md` - Full API documentation
- `BACKEND_API_DOCUMENTATION.md` - Backend endpoint reference
- `MINIMAL_API_DESIGN.md` - API design documentation
