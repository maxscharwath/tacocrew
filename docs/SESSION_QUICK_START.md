# 🚀 Session-Based API Quick Start

## What Changed?

The API now uses **sessions** to handle multiple concurrent orders. Each order process gets its own session with isolated state.

## Basic Workflow

### 1. Create a Session
Every order flow starts with creating a session:

```bash
curl -X POST http://localhost:4000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "customerName": "John Doe"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Save the `sessionId`** - you'll need it for all subsequent requests!

### 2. Add Items to Cart

Use the sessionId in the URL:

```bash
# Add a taco
curl -X POST http://localhost:4000/api/v1/sessions/550e8400-e29b-41d4-a716-446655440000/cart/tacos \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [{"id": "viande_hachee", "quantity": 2}],
    "sauces": ["harissa"],
    "garnitures": ["salade"]
  }'
```

```bash
# Add extras
curl -X POST http://localhost:4000/api/v1/sessions/550e8400-e29b-41d4-a716-446655440000/cart/extras \
  -H "Content-Type: application/json" \
  -d '{
    "id": "extra_frites",
    "name": "Frites",
    "price": 3.50,
    "quantity": 1,
    "free_sauces": []
  }'
```

### 3. View Cart

```bash
curl http://localhost:4000/api/v1/sessions/550e8400-e29b-41d4-a716-446655440000/cart
```

### 4. Edit a Taco

```bash
# Update taco at index 0
curl -X PUT http://localhost:4000/api/v1/sessions/550e8400-e29b-41d4-a716-446655440000/cart/tacos/0 \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XXL",
    "meats": [{"id": "viande_hachee", "quantity": 3}],
    "sauces": ["harissa", "algérienne"],
    "garnitures": ["salade", "tomates"]
  }'
```

### 5. Remove a Taco

```bash
# Delete taco at index 0
curl -X DELETE http://localhost:4000/api/v1/sessions/550e8400-e29b-41d4-a716-446655440000/cart/tacos/0
```

### 6. Place Order

```bash
curl -X POST http://localhost:4000/api/v1/sessions/550e8400-e29b-41d4-a716-446655440000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "John Doe",
      "phone": "+41791234567"
    },
    "delivery": {
      "type": "livraison",
      "address": "123 Rue Example, 1000 Lausanne",
      "requestedFor": "15:00"
    }
  }'
```

### 7. Clean Up (Optional)

```bash
# Delete session after order is complete
curl -X DELETE http://localhost:4000/api/v1/sessions/550e8400-e29b-41d4-a716-446655440000
```

## JavaScript/TypeScript Example

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api/v1';

async function completeOrderFlow() {
  // 1. Create session
  const sessionResponse = await axios.post(`${API_BASE}/sessions`, {
    metadata: { customerName: 'John Doe' }
  });
  const sessionId = sessionResponse.data.data.sessionId;
  console.log('Created session:', sessionId);

  // 2. Add taco
  await axios.post(`${API_BASE}/sessions/${sessionId}/cart/tacos`, {
    size: 'tacos_XL',
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa'],
    garnitures: ['salade']
  });
  console.log('Added taco');

  // 3. View cart
  const cartResponse = await axios.get(`${API_BASE}/sessions/${sessionId}/cart`);
  console.log('Cart:', cartResponse.data.data);

  // 4. Edit taco (upgrade size)
  await axios.put(`${API_BASE}/sessions/${sessionId}/cart/tacos/0`, {
    size: 'tacos_XXL',
    meats: [{ id: 'viande_hachee', quantity: 3 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates']
  });
  console.log('Upgraded taco to XXL');

  // 5. Place order
  const orderResponse = await axios.post(`${API_BASE}/sessions/${sessionId}/orders`, {
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
  console.log('Order placed:', orderResponse.data.data.orderId);

  // 6. Clean up
  await axios.delete(`${API_BASE}/sessions/${sessionId}`);
  console.log('Session deleted');
}

completeOrderFlow();
```

## React Hook Example

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

function useTacosSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      const response = await axios.post('/api/v1/sessions');
      setSessionId(response.data.data.sessionId);
    };
    createSession();
  }, []);

  const addTaco = async (taco: AddTacoRequest) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await axios.post(`/api/v1/sessions/${sessionId}/cart/tacos`, taco);
    } finally {
      setLoading(false);
    }
  };

  const getCart = async () => {
    if (!sessionId) return null;
    const response = await axios.get(`/api/v1/sessions/${sessionId}/cart`);
    return response.data.data;
  };

  const updateTaco = async (id: number, taco: UpdateTacoRequest) => {
    if (!sessionId) return;
    await axios.put(`/api/v1/sessions/${sessionId}/cart/tacos/${id}`, taco);
  };

  const deleteTaco = async (id: number) => {
    if (!sessionId) return;
    await axios.delete(`/api/v1/sessions/${sessionId}/cart/tacos/${id}`);
  };

  return { sessionId, loading, addTaco, getCart, updateTaco, deleteTaco };
}

// Usage in component
function TacosOrder() {
  const { sessionId, addTaco, getCart, updateTaco, deleteTaco } = useTacosSession();

  const handleAddTaco = () => {
    addTaco({
      size: 'tacos_XL',
      meats: [{ id: 'viande_hachee', quantity: 2 }],
      sauces: ['harissa'],
      garnitures: ['salade']
    });
  };

  return <div>Session: {sessionId}</div>;
}
```

## Multiple Concurrent Orders

The beauty of sessions is that multiple users can order simultaneously:

```typescript
// User 1's order
const session1 = await createSession();
await addTaco(session1, tacoForUser1);

// User 2's order (completely independent)
const session2 = await createSession();
await addTaco(session2, tacoForUser2);

// Edit User 1's taco (doesn't affect User 2)
await updateTaco(session1, 0, updatedTaco);
```

## Session Management Endpoints

```bash
# List all sessions
curl http://localhost:4000/api/v1/sessions

# Get session info
curl http://localhost:4000/api/v1/sessions/{sessionId}

# Get statistics
curl http://localhost:4000/api/v1/sessions/stats

# Delete session
curl -X DELETE http://localhost:4000/api/v1/sessions/{sessionId}
```

## Tips

### 1. Store SessionId in Browser
```javascript
// Save to localStorage
localStorage.setItem('tacosSessionId', sessionId);

// Retrieve later
const sessionId = localStorage.getItem('tacosSessionId');
```

### 2. Handle Session Expiration
Sessions expire after 24 hours. Check and recreate if needed:

```javascript
try {
  await getCart(sessionId);
} catch (error) {
  if (error.response?.data?.error?.code === 'SESSION_NOT_FOUND') {
    // Create new session
    const newSession = await createSession();
    localStorage.setItem('tacosSessionId', newSession.sessionId);
  }
}
```

### 3. Clean Up After Order
```javascript
// After successful order
await placeOrder(sessionId, orderData);
await deleteSession(sessionId);
localStorage.removeItem('tacosSessionId');
```

## Migration from Old API

### Before (Old API)
```javascript
// ❌ Single global cart - not suitable for multiple orders
POST /api/v1/cart/tacos
GET /api/v1/cart
POST /api/v1/orders
```

### After (New Session-Based API)
```javascript
// ✅ Session-based - supports multiple concurrent orders
const session = await createSession();
POST /api/v1/sessions/{sessionId}/cart/tacos
GET /api/v1/sessions/{sessionId}/cart
POST /api/v1/sessions/{sessionId}/orders
```

## Testing

```bash
# Install dependencies
npm install

# Start server
npm run dev:api

# In another terminal, test the flow
curl -X POST http://localhost:4000/api/v1/sessions | jq -r '.data.sessionId' > session.txt
SESSION_ID=$(cat session.txt)

curl -X POST http://localhost:4000/api/v1/sessions/$SESSION_ID/cart/tacos \
  -H "Content-Type: application/json" \
  -d '{"size":"tacos_XL","meats":[{"id":"viande_hachee","quantity":2}],"sauces":["harissa"],"garnitures":["salade"]}'

curl http://localhost:4000/api/v1/sessions/$SESSION_ID/cart | jq
```

## Common Issues

### "Session not found"
**Cause**: Session expired or doesn't exist  
**Solution**: Create a new session

### "CSRF token invalid"
**Cause**: Session token expired  
**Solution**: The system auto-refreshes tokens. If error persists, create a new session.

### Empty cart after adding items
**Cause**: Using wrong sessionId  
**Solution**: Ensure you're using the correct sessionId from the create session response

## Next Steps

- Read the full [SESSION_ARCHITECTURE.md](./SESSION_ARCHITECTURE.md) for details
- See [TYPESCRIPT_README.md](./TYPESCRIPT_README.md) for general API documentation
- Check [examples/session-usage.ts](./examples/session-usage.ts) for complete examples

---

**Happy ordering! 🌮**
