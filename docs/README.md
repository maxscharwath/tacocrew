# ?? Tacos Ordering API - RESTful TypeScript Application

A modern, fully-typed TypeScript API for managing taco orders with pure RESTful design using UUIDs in the URL path.

## Quick Start

### 1. Install & Run
```bash
npm install
npm run dev:api
```

### 2. Get a Cart ID (or use your own UUID)
```bash
# Option A: Let API generate one for you
curl -X POST http://localhost:4000/api/v1/carts

# Response:
{
  "success": true,
  "data": {
    "cartId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

```bash
# Option B: Use your own UUID
CART_ID="550e8400-e29b-41d4-a716-446655440000"
```

### 3. Use the API
```bash
CART_ID="550e8400-e29b-41d4-a716-446655440000"

# Add taco
curl -X POST http://localhost:4000/api/v1/carts/$CART_ID/tacos \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [{"id": "viande_hachee", "quantity": 2}],
    "sauces": ["harissa"],
    "garnitures": ["salade"]
  }'

# Get cart
curl http://localhost:4000/api/v1/carts/$CART_ID

# Edit taco
curl -X PUT http://localhost:4000/api/v1/carts/$CART_ID/tacos/0 \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XXL",
    "meats": [{"id": "viande_hachee", "quantity": 3}],
    "sauces": ["harissa", "alg?rienne"],
    "garnitures": ["salade", "tomates"]
  }'

# Remove taco
curl -X DELETE http://localhost:4000/api/v1/carts/$CART_ID/tacos/0

# Place order
curl -X POST http://localhost:4000/api/v1/carts/$CART_ID/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"name": "John", "phone": "+41791234567"},
    "delivery": {"type": "livraison", "address": "123 Rue Example", "requestedFor": "15:00"}
  }'
```

## API Endpoints

### Pure RESTful Design

All endpoints use UUID in the path - no headers, no session management!

```
POST   /api/v1/carts                    ? Generate new cart ID (optional)
GET    /api/v1/carts/{cartId}           ? Get cart
POST   /api/v1/carts/{cartId}/tacos     ? Add taco
GET    /api/v1/carts/{cartId}/tacos/:id ? Get taco
PUT    /api/v1/carts/{cartId}/tacos/:id ? Edit taco
DELETE /api/v1/carts/{cartId}/tacos/:id ? Remove taco
PATCH  /api/v1/carts/{cartId}/tacos/:id/quantity ? Update quantity
POST   /api/v1/carts/{cartId}/extras    ? Add extra
POST   /api/v1/carts/{cartId}/drinks    ? Add drink
POST   /api/v1/carts/{cartId}/desserts  ? Add dessert
POST   /api/v1/carts/{cartId}/orders    ? Place order
GET    /api/v1/resources/stock          ? Get stock (global)
```

## JavaScript Client Example

```javascript
import { v4 as uuidv4 } from 'uuid';

class TacosAPI {
  constructor(cartId = null) {
    this.cartId = cartId || uuidv4();  // Generate or use provided
    this.baseUrl = 'http://localhost:4000/api/v1';
  }

  async request(method, path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    return response.json();
  }

  // Cart operations
  getCart() {
    return this.request('GET', `/carts/${this.cartId}`);
  }

  async addTaco(taco) {
    const response = await this.request('POST', `/carts/${this.cartId}/tacos`, taco);
    return response.data;  // Returns { id: "uuid", size: "tacos_XL", ... }
  }

  updateTaco(tacoId, taco) {
    return this.request('PUT', `/carts/${this.cartId}/tacos/${tacoId}`, taco);
  }

  deleteTaco(tacoId) {
    return this.request('DELETE', `/carts/${this.cartId}/tacos/${tacoId}`);
  }

  addExtra(extra) {
    return this.request('POST', `/carts/${this.cartId}/extras`, extra);
  }

  placeOrder(order) {
    return this.request('POST', `/carts/${this.cartId}/orders`, order);
  }
}

// Usage
const api = new TacosAPI();  // Auto-generates cart UUID
console.log(`Cart ID: ${api.cartId}`);

// Add taco - returns taco with UUID
const taco = await api.addTaco({
  size: 'tacos_XL',
  meats: [{ id: 'viande_hachee', quantity: 2 }],
  sauces: ['harissa'],
  garnitures: ['salade']
});
console.log(`Taco ID: ${taco.id}`);  // UUID like "550e8400-..."

// Get cart
await api.getCart();

// Update taco using its UUID
await api.updateTaco(taco.id, { 
  size: 'tacos_XXL',
  meats: [{ id: 'viande_hachee', quantity: 3 }],
  sauces: ['harissa'],
  garnitures: ['salade']
});

// Delete taco using its UUID
await api.deleteTaco(taco.id);
```

## Multiple Concurrent Orders

Each cart has its own UUID - completely isolated:

```javascript
// Order 1
const cart1 = new TacosAPI();  // UUID: abc-123
await cart1.addTaco(taco1);

// Order 2 (completely independent)
const cart2 = new TacosAPI();  // UUID: def-456
await cart2.addTaco(taco2);

// No conflicts!
```

## Features

### ? Pure RESTful
- UUID in URL path
- No headers needed
- Standard HTTP methods
- Resource-based design

### ? Multiple Orders
- Each cart has unique UUID
- Isolated state
- Concurrent operations
- No interference

### ? Full CRUD
- Create tacos
- Read cart
- Update tacos
- Delete tacos

### ? Type-Safe
- 100% TypeScript
- Strict mode
- Full IntelliSense
- Zero `any` types

## Architecture

```
/api/v1/carts/{cartId}
    ??? GET                    # Get cart
    ??? /tacos
    ?   ??? POST              # Add taco
    ?   ??? /:id
    ?       ??? GET           # Get taco
    ?       ??? PUT           # Update taco
    ?       ??? DELETE        # Remove taco
    ?       ??? /quantity
    ?           ??? PATCH     # Update quantity
    ??? /extras
    ?   ??? POST              # Add extra
    ??? /drinks
    ?   ??? POST              # Add drink
    ??? /desserts
    ?   ??? POST              # Add dessert
    ??? /orders
        ??? POST              # Place order
```

## Environment Setup

Copy `.env.example` to `.env`:

```bash
BACKEND_BASE_URL=https://your-backend.com
WEB_API_ENABLED=true
WEB_API_PORT=4000
LOG_LEVEL=info
NODE_ENV=development
```

## Development

```bash
# Development (hot reload)
npm run dev:api

# Production build
npm run build
npm start:api

# Type checking
npm run type-check

# Linting & formatting
npm run lint:fix
npm run format
```

## Examples

See working examples in `examples/restful-usage.ts`:

```bash
npx ts-node examples/restful-usage.ts
```

## Documentation

- **[TYPESCRIPT_README.md](./TYPESCRIPT_README.md)** - Full TypeScript app docs
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Backend API reference
- **[examples/](./examples/)** - Working code examples

## Project Structure

```
src/
??? api/
?   ??? client.ts              # Global HTTP client
?   ??? session-client.ts      # Session-aware client
??? controllers/
?   ??? api.controller.ts      # RESTful handlers
??? services/
?   ??? cart.service.ts        # Cart operations
?   ??? order.service.ts       # Order operations
?   ??? resource.service.ts    # Stock operations
?   ??? session.service.ts     # UUID/session management
??? types/
?   ??? index.ts               # Core types
?   ??? session.ts             # Session types
??? web-api.ts                 # Express app
```

## How It Works

### 1. Generate or Provide UUID
```javascript
// Option A: Auto-generate
const cartId = uuidv4();

// Option B: API generates
const response = await fetch('/api/v1/carts', { method: 'POST' });
const { cartId } = response.data;
```

### 2. Use UUIDs in Requests
```javascript
// Cart UUID in the path
GET    /api/v1/carts/{cartId}
POST   /api/v1/carts/{cartId}/tacos

// Taco UUID also in the path
GET    /api/v1/carts/{cartId}/tacos/{tacoId}
PUT    /api/v1/carts/{cartId}/tacos/{tacoId}
DELETE /api/v1/carts/{cartId}/tacos/{tacoId}
```

**Both cart and tacos use UUIDs!**

### 3. UUIDs Everywhere
- **Cart ID**: Your cart identifier (UUID)
- **Taco ID**: Each taco gets its own UUID when added
- Behind the scenes, the API creates a session automatically!

## Why This Design?

### ? Standard RESTful
- Follows REST conventions
- Resource-based URLs
- Predictable structure

### ? No Headers
- Just HTTP methods and URLs
- Easy to test with cURL
- Simple client implementation

### ? Stateless
- UUID identifies the resource
- No server-side session cookies
- Scalable and cacheable

### ? Multi-User
- Each cart is independent
- No conflicts
- Concurrent access

## Testing

```bash
# Manual testing
CART_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

# Add taco - returns taco with UUID
RESPONSE=$(curl -X POST http://localhost:4000/api/v1/carts/$CART_ID/tacos \
  -H "Content-Type: application/json" \
  -d '{"size":"tacos_L","meats":[{"id":"viande_hachee","quantity":1}],"sauces":["harissa"],"garnitures":["salade"]}')

# Extract taco UUID from response
TACO_ID=$(echo $RESPONSE | jq -r '.data.id')

# Get cart
curl http://localhost:4000/api/v1/carts/$CART_ID

# Edit taco
curl -X PUT http://localhost:4000/api/v1/carts/$CART_ID/tacos/$TACO_ID \
  -H "Content-Type: application/json" \
  -d '{"size":"tacos_XL","meats":[{"id":"viande_hachee","quantity":2}],"sauces":["harissa"],"garnitures":["salade"]}'

# Delete taco
curl -X DELETE http://localhost:4000/api/v1/carts/$CART_ID/tacos/$TACO_ID
```

## Support

- **Examples**: See `examples/` directory
- **Logs**: Check `logs/combined.log`
- **Docs**: Read `TYPESCRIPT_README.md`

---

**Simple RESTful API with UUIDs - no headers, no complexity! ??**
