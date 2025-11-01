# 🚀 Quick Start - Hidden Sessions

## What You Need to Know

**Sessions are automatic!** Just start making requests. The API handles everything behind the scenes.

## 5-Minute Start

### 1. Start the Server
```bash
npm install
npm run dev:api
```

### 2. Make Your First Request
```bash
# Add a taco - no setup needed!
curl -X POST http://localhost:4000/api/v1/cart/tacos \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [{"id": "viande_hachee", "quantity": 2}],
    "sauces": ["harissa"],
    "garnitures": ["salade"]
  }' -v
```

Look at the response headers:
```
X-Session-Id: 550e8400-e29b-41d4-a716-446655440000
```

**That's your session ID!** Save it for subsequent requests.

### 3. Use Your Session
```bash
# Save the session ID
SESSION_ID="550e8400-e29b-41d4-a716-446655440000"

# Get cart
curl http://localhost:4000/api/v1/cart \
  -H "X-Session-Id: $SESSION_ID"

# Edit taco
curl -X PUT http://localhost:4000/api/v1/cart/tacos/0 \
  -H "X-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XXL",
    "meats": [{"id": "viande_hachee", "quantity": 3}],
    "sauces": ["harissa", "algérienne"],
    "garnitures": ["salade", "tomates"]
  }'

# Remove taco
curl -X DELETE http://localhost:4000/api/v1/cart/tacos/0 \
  -H "X-Session-Id: $SESSION_ID"
```

## API Endpoints

All endpoints are simple and flat:

```
GET    /api/v1/cart              → Get cart
POST   /api/v1/cart/tacos        → Add taco
PUT    /api/v1/cart/tacos/:id    → Edit taco
DELETE /api/v1/cart/tacos/:id    → Remove taco
POST   /api/v1/cart/extras       → Add extra
POST   /api/v1/cart/drinks       → Add drink
POST   /api/v1/orders            → Place order
```

**No `/sessions/` prefix!** Sessions are invisible.

## JavaScript Example

```javascript
// Simple client that auto-manages sessions
class TacosAPI {
  constructor() {
    this.sessionId = null;
    this.baseUrl = 'http://localhost:4000/api/v1';
  }

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    
    // Include session ID if we have one
    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Extract session ID from response (auto-created)
    const sessionId = response.headers.get('X-Session-Id');
    if (sessionId) {
      this.sessionId = sessionId;
      localStorage.setItem('tacosSessionId', sessionId);
    }

    return response.json();
  }

  addTaco(taco) {
    return this.request('POST', '/cart/tacos', taco);
  }

  getCart() {
    return this.request('GET', '/cart');
  }

  updateTaco(id, taco) {
    return this.request('PUT', `/cart/tacos/${id}`, taco);
  }

  deleteTaco(id) {
    return this.request('DELETE', `/cart/tacos/${id}`);
  }

  placeOrder(order) {
    return this.request('POST', '/orders', order);
  }
}

// Usage
const api = new TacosAPI();

// First call - session auto-created
await api.addTaco({
  size: 'tacos_XL',
  meats: [{ id: 'viande_hachee', quantity: 2 }],
  sauces: ['harissa'],
  garnitures: ['salade']
});

// Session is now set - subsequent calls use it automatically
await api.getCart();
await api.updateTaco(0, { /* updated taco */ });
await api.deleteTaco(0);
await api.placeOrder({ /* order data */ });
```

## How It Works

### 1. First Request (No Session ID)
```
→ POST /api/v1/cart/tacos
  (no X-Session-Id header)

← 201 Created
  X-Session-Id: 550e8400-e29b-41d4-a716-446655440000
```

Server auto-generates a UUID and returns it.

### 2. Subsequent Requests (With Session ID)
```
→ GET /api/v1/cart
  X-Session-Id: 550e8400-e29b-41d4-a716-446655440000

← 200 OK
  X-Session-Id: 550e8400-e29b-41d4-a716-446655440000
```

Server uses your session to maintain state.

## Multiple Users

Each client gets its own session automatically:

```javascript
// User A
const apiA = new TacosAPI();
await apiA.addTaco(tacoA);  // Auto-creates session A

// User B  
const apiB = new TacosAPI();
await apiB.addTaco(tacoB);  // Auto-creates session B

// No conflicts! Each has their own cart
```

## Complete Example

```javascript
const api = new TacosAPI();

// 1. Add items (session auto-created)
await api.addTaco({
  size: 'tacos_XL',
  meats: [{ id: 'viande_hachee', quantity: 2 }],
  sauces: ['harissa'],
  garnitures: ['salade']
});

await api.request('POST', '/cart/extras', {
  id: 'extra_frites',
  name: 'Frites',
  price: 3.50,
  quantity: 1
});

// 2. Review cart
const cart = await api.getCart();
console.log(`Total: CHF ${cart.data.summary.total.price}`);

// 3. Edit taco (upgrade size)
await api.updateTaco(0, {
  size: 'tacos_XXL',
  meats: [{ id: 'viande_hachee', quantity: 3 }],
  sauces: ['harissa', 'algérienne'],
  garnitures: ['salade', 'tomates']
});

// 4. Place order
const order = await api.placeOrder({
  customer: {
    name: 'John Doe',
    phone: '+41791234567'
  },
  delivery: {
    type: 'livraison',
    address: '123 Rue Example',
    requestedFor: '15:00'
  }
});

console.log(`Order placed: ${order.data.orderId}`);
```

## Tips

### Store Session ID
```javascript
// Save for later use
localStorage.setItem('tacosSessionId', sessionId);

// Restore on page load
const api = new TacosAPI();
api.sessionId = localStorage.getItem('tacosSessionId');
```

### Clear After Order
```javascript
// After successful order
await api.placeOrder(orderData);
localStorage.removeItem('tacosSessionId');
api.sessionId = null;
```

### Custom Session ID
```javascript
// Provide your own UUID if you want
import { v4 as uuidv4 } from 'uuid';
api.sessionId = uuidv4();
```

## Next Steps

- **Full docs**: See [HIDDEN_SESSIONS.md](./HIDDEN_SESSIONS.md)
- **Examples**: See [examples/hidden-session-usage.ts](./examples/hidden-session-usage.ts)
- **General docs**: See [TYPESCRIPT_README.md](./TYPESCRIPT_README.md)

---

**That's it! Sessions just work. 🎉**
