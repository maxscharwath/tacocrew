# 🔐 Hidden Session Management

## Overview

Sessions are now **completely automatic and transparent**. You don't need to create or manage sessions explicitly - just include a `X-Session-Id` header (or let the API generate one for you).

## How It Works

### Automatic Session Creation

```bash
# First request - no session ID
curl http://localhost:4000/api/v1/cart

# Server auto-generates UUID and returns it in header:
# X-Session-Id: 550e8400-e29b-41d4-a716-446655440000
```

### Reusing Sessions

```bash
# Subsequent requests - include the session ID
curl http://localhost:4000/api/v1/cart/tacos \
  -H "X-Session-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [{"id": "viande_hachee", "quantity": 2}],
    "sauces": ["harissa"],
    "garnitures": ["salade"]
  }'
```

## Simple API Endpoints

All endpoints are now flat and intuitive:

```
GET    /api/v1/cart              → Get cart
POST   /api/v1/cart/tacos        → Add taco
PUT    /api/v1/cart/tacos/:id    → Edit taco
DELETE /api/v1/cart/tacos/:id    → Remove taco
POST   /api/v1/cart/extras       → Add extra
POST   /api/v1/cart/drinks       → Add drink
POST   /api/v1/orders            → Place order
GET    /api/v1/resources/stock   → Get stock
```

**No `/sessions/` prefix needed!**

## Client Implementation

### JavaScript/TypeScript

```typescript
class TacosAPI {
  private sessionId: string | null = null;
  private baseUrl = 'http://localhost:4000/api/v1';

  private async request(method: string, path: string, body?: unknown) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Include session ID if we have one
    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Extract session ID from response (auto-created or existing)
    const responseSessionId = response.headers.get('X-Session-Id');
    if (responseSessionId) {
      this.sessionId = responseSessionId;
      // Save to localStorage for persistence
      localStorage.setItem('tacosSessionId', responseSessionId);
    }

    return response.json();
  }

  async getCart() {
    return this.request('GET', '/cart');
  }

  async addTaco(taco: AddTacoRequest) {
    return this.request('POST', '/cart/tacos', taco);
  }

  async updateTaco(id: number, taco: UpdateTacoRequest) {
    return this.request('PUT', `/cart/tacos/${id}`, taco);
  }

  async deleteTaco(id: number) {
    return this.request('DELETE', `/cart/tacos/${id}`);
  }

  async placeOrder(order: CreateOrderRequest) {
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

// Subsequent calls - same session automatically
await api.getCart();
await api.updateTaco(0, { /* updated taco */ });
await api.deleteTaco(0);
```

### React Hook

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

function useTacosAPI() {
  const [sessionId, setSessionId] = useState<string | null>(
    () => localStorage.getItem('tacosSessionId')
  );

  // Create axios instance with interceptors
  const api = axios.create({
    baseURL: 'http://localhost:4000/api/v1',
  });

  // Request interceptor - add session ID
  api.interceptors.request.use((config) => {
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId;
    }
    return config;
  });

  // Response interceptor - extract session ID
  api.interceptors.response.use((response) => {
    const newSessionId = response.headers['x-session-id'];
    if (newSessionId && newSessionId !== sessionId) {
      setSessionId(newSessionId);
      localStorage.setItem('tacosSessionId', newSessionId);
    }
    return response;
  });

  return {
    sessionId,
    getCart: () => api.get('/cart'),
    addTaco: (taco: AddTacoRequest) => api.post('/cart/tacos', taco),
    updateTaco: (id: number, taco: UpdateTacoRequest) => 
      api.put(`/cart/tacos/${id}`, taco),
    deleteTaco: (id: number) => api.delete(`/cart/tacos/${id}`),
    placeOrder: (order: CreateOrderRequest) => api.post('/orders', order),
  };
}

// Usage in component
function OrderPage() {
  const { sessionId, addTaco, getCart, updateTaco, deleteTaco } = useTacosAPI();

  const handleAddTaco = async () => {
    await addTaco({
      size: 'tacos_XL',
      meats: [{ id: 'viande_hachee', quantity: 2 }],
      sauces: ['harissa'],
      garnitures: ['salade']
    });
    // Session is automatically managed!
  };

  return <div>Session: {sessionId}</div>;
}
```

### Python

```python
import requests
import uuid

class TacosAPI:
    def __init__(self):
        self.base_url = 'http://localhost:4000/api/v1'
        self.session_id = None
    
    def _request(self, method, path, json=None):
        headers = {'Content-Type': 'application/json'}
        
        # Include session ID if we have one
        if self.session_id:
            headers['X-Session-Id'] = self.session_id
        
        response = requests.request(
            method,
            f'{self.base_url}{path}',
            headers=headers,
            json=json
        )
        
        # Extract session ID from response
        response_session_id = response.headers.get('X-Session-Id')
        if response_session_id:
            self.session_id = response_session_id
        
        return response.json()
    
    def get_cart(self):
        return self._request('GET', '/cart')
    
    def add_taco(self, taco):
        return self._request('POST', '/cart/tacos', taco)
    
    def update_taco(self, taco_id, taco):
        return self._request('PUT', f'/cart/tacos/{taco_id}', taco)
    
    def delete_taco(self, taco_id):
        return self._request('DELETE', f'/cart/tacos/{taco_id}')
    
    def place_order(self, order):
        return self._request('POST', '/orders', order)

# Usage
api = TacosAPI()

# First call - session auto-created
api.add_taco({
    'size': 'tacos_XL',
    'meats': [{'id': 'viande_hachee', 'quantity': 2}],
    'sauces': ['harissa'],
    'garnitures': ['salade']
})

# Session is now set automatically
cart = api.get_cart()
print(f"Session ID: {api.session_id}")
```

## Multiple Concurrent Orders

Each client can have its own session:

```typescript
// User A's order
const apiA = new TacosAPI();
await apiA.addTaco(tacoA);  // Auto-creates session A

// User B's order
const apiB = new TacosAPI();
await apiB.addTaco(tacoB);  // Auto-creates session B

// No conflicts! Each has their own session
```

## Session Lifecycle

### Auto-Creation
- First request without `X-Session-Id` → Server generates UUID
- Server returns UUID in `X-Session-Id` response header
- Client saves and reuses UUID

### Reuse
- Client includes `X-Session-Id` in subsequent requests
- Same cart/state maintained across requests

### Expiration
- Sessions expire after 24 hours of inactivity
- Automatic cleanup every hour
- Client can detect expired session and start new one

## Best Practices

### 1. Store Session ID
```typescript
// Save to localStorage/sessionStorage
localStorage.setItem('tacosSessionId', sessionId);

// Restore on page load
const savedSessionId = localStorage.getItem('tacosSessionId');
```

### 2. Handle Expiration
```typescript
try {
  await api.getCart();
} catch (error) {
  if (error.response?.status === 404) {
    // Session expired - clear and start fresh
    localStorage.removeItem('tacosSessionId');
    api.sessionId = null;
  }
}
```

### 3. Clear After Order
```typescript
// After successful order
await api.placeOrder(orderData);
localStorage.removeItem('tacosSessionId');
api.sessionId = null;  // Start fresh for next order
```

### 4. Provide Your Own UUID (Optional)
```typescript
// Generate your own UUID if you want
import { v4 as uuidv4 } from 'uuid';

const mySessionId = uuidv4();
headers['X-Session-Id'] = mySessionId;
```

## Advantages

### ✅ Simple API
- No session creation endpoints
- No `/sessions/` prefix in URLs
- Clean, intuitive API structure

### ✅ Transparent
- Sessions managed automatically
- Clients don't need to think about session lifecycle
- Works like traditional REST API

### ✅ Flexible
- Auto-generate UUID or provide your own
- Store session ID however you want (localStorage, cookies, etc.)
- Multiple sessions for concurrent orders

### ✅ Secure
- Each session has isolated state
- Per-session CSRF tokens
- UUID-based identification

## cURL Examples

```bash
# First request - no session
curl http://localhost:4000/api/v1/cart -v
# Response includes: X-Session-Id: 550e8400-e29b-41d4-a716-446655440000

# Save the session ID and reuse it
SESSION_ID="550e8400-e29b-41d4-a716-446655440000"

# Add taco with session
curl -X POST http://localhost:4000/api/v1/cart/tacos \
  -H "X-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [{"id": "viande_hachee", "quantity": 2}],
    "sauces": ["harissa"],
    "garnitures": ["salade"]
  }'

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

# Delete taco
curl -X DELETE http://localhost:4000/api/v1/cart/tacos/0 \
  -H "X-Session-Id: $SESSION_ID"

# Place order
curl -X POST http://localhost:4000/api/v1/orders \
  -H "X-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"name": "John", "phone": "+41791234567"},
    "delivery": {"type": "livraison", "address": "123 Rue Example", "requestedFor": "15:00"}
  }'
```

## Query Parameter Alternative

You can also pass session ID as query parameter:

```bash
# Using query parameter instead of header
curl http://localhost:4000/api/v1/cart?sessionId=550e8400-e29b-41d4-a716-446655440000
```

This is useful for:
- Simple clients without header support
- Testing in browsers
- Quick debugging

## Implementation Details

Sessions are managed by middleware that:
1. Checks for `X-Session-Id` header or `sessionId` query param
2. Auto-creates session if not found
3. Attaches `sessionId` to `req.sessionId`
4. Returns session ID in `X-Session-Id` response header
5. Services use `req.sessionId` transparently

**You never see session management in the API!**

---

**Sessions are now invisible - just use the API naturally! 🎉**
