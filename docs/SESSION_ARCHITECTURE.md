# 🔐 Session-Based Architecture

## Overview

The application now uses a **session-based architecture** where each order process has its own isolated session with dedicated CSRF tokens and cookies. This allows:

- ✅ **Multiple concurrent orders** without interference
- ✅ **Independent cart management** per session
- ✅ **Isolated CSRF tokens** and authentication
- ✅ **Edit/remove tacos** for specific orders
- ✅ **UUID-based session identification**

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
│            (Web App / Slack Bot / API Consumer)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1. Create Session
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   POST /api/v1/sessions                      │
│                  Returns: { sessionId }                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 2. Use sessionId for all requests
                            ↓
┌─────────────────────────────────────────────────────────────┐
│        /api/v1/sessions/{sessionId}/cart/tacos              │
│        /api/v1/sessions/{sessionId}/cart/extras             │
│        /api/v1/sessions/{sessionId}/orders                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Session Manager                            │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ Session A    │ Session B    │ Session C    │            │
│  │ UUID: abc... │ UUID: def... │ UUID: ghi... │            │
│  │ Token: xxx   │ Token: yyy   │ Token: zzz   │            │
│  │ Cookies: {}  │ Cookies: {}  │ Cookies: {}  │            │
│  └──────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend PHP API                            │
│            (Each session = separate cart)                    │
└─────────────────────────────────────────────────────────────┘
```

## Session Lifecycle

### 1. Create Session

```http
POST /api/v1/sessions
Content-Type: application/json

{
  "metadata": {
    "customerName": "John Doe",
    "orderType": "delivery"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T10:30:00Z",
    "metadata": {
      "customerName": "John Doe",
      "orderType": "delivery"
    }
  }
}
```

### 2. Use Session for Operations

All cart and order operations now require the `sessionId` in the URL:

```http
# Add taco to specific session
POST /api/v1/sessions/{sessionId}/cart/tacos

# Get cart for specific session
GET /api/v1/sessions/{sessionId}/cart

# Place order for specific session
POST /api/v1/sessions/{sessionId}/orders
```

### 3. Manage Session

```http
# Get session info
GET /api/v1/sessions/{sessionId}

# Delete session (clean up)
DELETE /api/v1/sessions/{sessionId}

# List all sessions
GET /api/v1/sessions

# Get statistics
GET /api/v1/sessions/stats
```

## Updated API Endpoints

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/sessions` | Create new session |
| `GET` | `/api/v1/sessions` | List all active sessions |
| `GET` | `/api/v1/sessions/stats` | Get session statistics |
| `GET` | `/api/v1/sessions/:sessionId` | Get session details |
| `DELETE` | `/api/v1/sessions/:sessionId` | Delete session |

### Cart Operations (Session-Scoped)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/sessions/:sessionId/cart` | Get cart |
| `POST` | `/api/v1/sessions/:sessionId/cart/tacos` | Add taco |
| `GET` | `/api/v1/sessions/:sessionId/cart/tacos/:id` | Get taco |
| `PUT` | `/api/v1/sessions/:sessionId/cart/tacos/:id` | Update taco |
| `PATCH` | `/api/v1/sessions/:sessionId/cart/tacos/:id/quantity` | Update quantity |
| `DELETE` | `/api/v1/sessions/:sessionId/cart/tacos/:id` | Delete taco |
| `POST` | `/api/v1/sessions/:sessionId/cart/extras` | Add extra |
| `POST` | `/api/v1/sessions/:sessionId/cart/drinks` | Add drink |
| `POST` | `/api/v1/sessions/:sessionId/cart/desserts` | Add dessert |

### Order Operations (Session-Scoped)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/sessions/:sessionId/orders` | Create order |

### Global Operations (No Session Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/resources/stock` | Get stock availability |

## Complete Workflow Example

### Scenario: Multiple Users Ordering Simultaneously

```javascript
// User 1: Creates session and orders
const session1 = await fetch('/api/v1/sessions', {
  method: 'POST',
  body: JSON.stringify({ metadata: { customerName: 'Alice' } })
});
const { sessionId: session1Id } = await session1.json();

// User 1: Adds taco
await fetch(`/api/v1/sessions/${session1Id}/cart/tacos`, {
  method: 'POST',
  body: JSON.stringify({
    size: 'tacos_XL',
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa'],
    garnitures: ['salade']
  })
});

// User 2: Creates separate session (concurrent)
const session2 = await fetch('/api/v1/sessions', {
  method: 'POST',
  body: JSON.stringify({ metadata: { customerName: 'Bob' } })
});
const { sessionId: session2Id } = await session2.json();

// User 2: Adds different taco (no conflict with User 1)
await fetch(`/api/v1/sessions/${session2Id}/cart/tacos`, {
  method: 'POST',
  body: JSON.stringify({
    size: 'tacos_L',
    meats: [{ id: 'escalope_de_poulet', quantity: 1 }],
    sauces: ['algérienne'],
    garnitures: ['tomates']
  })
});

// User 1: Edits their taco (User 2's order unaffected)
await fetch(`/api/v1/sessions/${session1Id}/cart/tacos/0`, {
  method: 'PUT',
  body: JSON.stringify({
    size: 'tacos_XXL',  // Upgraded!
    meats: [{ id: 'viande_hachee', quantity: 3 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates']
  })
});

// User 1: Places order
await fetch(`/api/v1/sessions/${session1Id}/orders`, {
  method: 'POST',
  body: JSON.stringify({
    customer: { name: 'Alice', phone: '+41791234567' },
    delivery: { type: 'livraison', address: '...', requestedFor: '15:00' }
  })
});

// User 2: Also places order (independent)
await fetch(`/api/v1/sessions/${session2Id}/orders`, {
  method: 'POST',
  body: JSON.stringify({
    customer: { name: 'Bob', phone: '+41797654321' },
    delivery: { type: 'emporter', requestedFor: '15:30' }
  })
});
```

## Session Data Structure

```typescript
interface SessionData {
  sessionId: string;           // UUID
  csrfToken: string;           // Session-specific CSRF token
  cookies: Record<string, string>;  // Session cookies
  createdAt: Date;             // Creation timestamp
  lastActivityAt: Date;        // Last activity (auto-updated)
  metadata?: {                 // Optional metadata
    customerName?: string;
    orderType?: string;
    [key: string]: unknown;
  };
}
```

## Session Storage

### Current: In-Memory Store
- Fast access
- No external dependencies
- Automatic cleanup (24-hour TTL)
- Suitable for single-server deployments

### Production: Use Redis/Database
For production with multiple servers, replace the in-memory store:

```typescript
// src/utils/session-store.ts
import { RedisSessionStore } from './redis-session-store';

export const sessionStore = new RedisSessionStore({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});
```

## Session Management

### Automatic Cleanup
- Sessions expire after **24 hours** of inactivity
- Cleanup runs automatically every hour
- Manual cleanup: `sessionService.cleanupExpiredSessions()`

### Session Statistics

```http
GET /api/v1/sessions/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 42,
    "activeSessions": 15,
    "oldestSession": "2024-01-14T10:00:00Z",
    "newestSession": "2024-01-15T11:30:00Z"
  }
}
```

## CSRF Token Management

### Per-Session Tokens
Each session has its own CSRF token:
- ✅ **Isolated authentication**
- ✅ **No token conflicts**
- ✅ **Automatic refresh** on 403 errors
- ✅ **Independent security**

### Token Lifecycle
1. **Created** when session is created
2. **Stored** in session data
3. **Sent** automatically with all requests
4. **Refreshed** if expired (403 error)

## Cookies Management

### Per-Session Cookies
Cookies are stored and sent per session:
- ✅ **Session isolation**
- ✅ **Automatic extraction** from responses
- ✅ **Automatic injection** in requests
- ✅ **No cookie conflicts**

## Migration from Old API

### Old (Single Session)
```javascript
// ❌ Old way - single global cart
POST /api/v1/cart/tacos
GET /api/v1/cart
```

### New (Multi-Session)
```javascript
// ✅ New way - session-specific cart
const session = await createSession();
POST /api/v1/sessions/{sessionId}/cart/tacos
GET /api/v1/sessions/{sessionId}/cart
```

### Backward Compatibility
To support old clients, you can create a "default session":

```javascript
// Create default session on app start
const defaultSession = await sessionService.createSession({
  metadata: { type: 'default' }
});

// Store sessionId and use for legacy endpoints
```

## Error Handling

### Session Not Found
```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found: {sessionId}"
  }
}
```

### Session Expired
Sessions expire after 24 hours. Create a new one:
```javascript
// Check if session exists
const exists = await sessionService.hasSession(sessionId);
if (!exists) {
  // Create new session
  const newSession = await sessionService.createSession();
}
```

## Best Practices

### 1. Create Session Early
```javascript
// Create session when user starts browsing
const session = await createSession();
// Store sessionId in browser localStorage
localStorage.setItem('tacosSessionId', session.sessionId);
```

### 2. Reuse Session ID
```javascript
// Get sessionId from storage
const sessionId = localStorage.getItem('tacosSessionId');
// Use for all requests
await addTacoToCart(sessionId, tacoData);
```

### 3. Handle Expiration
```javascript
try {
  await getCart(sessionId);
} catch (error) {
  if (error.code === 'SESSION_NOT_FOUND') {
    // Create new session
    const newSession = await createSession();
    localStorage.setItem('tacosSessionId', newSession.sessionId);
  }
}
```

### 4. Clean Up
```javascript
// After order is placed, optionally delete session
await placeOrder(sessionId, orderData);
await deleteSession(sessionId);
localStorage.removeItem('tacosSessionId');
```

### 5. Use Metadata
```javascript
// Store useful info in session metadata
await createSession({
  metadata: {
    customerName: 'John',
    orderType: 'delivery',
    source: 'web',
    language: 'fr'
  }
});
```

## Performance Considerations

### Session Limits
- In-memory store can handle **thousands** of sessions
- Each session: ~1KB memory
- Automatic cleanup prevents memory leaks

### Optimization Tips
1. **Delete sessions** after order completion
2. **Set shorter TTL** if needed (modify `SESSION_MAX_AGE_MS`)
3. **Use Redis** for high-traffic scenarios
4. **Monitor** session count with `/sessions/stats`

## Security

### Session Isolation
- ✅ Each session has unique UUID
- ✅ CSRF tokens are session-specific
- ✅ Cookies are isolated per session
- ✅ No cross-session data leakage

### UUID Format
Uses UUID v4 (random): `550e8400-e29b-41d4-a716-446655440000`
- Cryptographically secure
- Non-sequential
- Unpredictable

## Testing

### Create Test Sessions
```javascript
// Test concurrent sessions
const session1 = await createSession();
const session2 = await createSession();

// Add items to both
await addTaco(session1.sessionId, taco1);
await addTaco(session2.sessionId, taco2);

// Verify isolation
const cart1 = await getCart(session1.sessionId);
const cart2 = await getCart(session2.sessionId);

assert(cart1.tacos.length === 1);
assert(cart2.tacos.length === 1);
assert(cart1.sessionId !== cart2.sessionId);
```

## Monitoring

### Health Check
```http
GET /health
```

Returns session statistics:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "sessions": {
      "totalSessions": 42,
      "activeSessions": 15
    }
  }
}
```

## Future Enhancements

### Planned Features
- [ ] Redis session store implementation
- [ ] Session persistence to database
- [ ] Session sharing (for collaborative ordering)
- [ ] Session history/audit log
- [ ] Rate limiting per session
- [ ] Session analytics

---

**The session-based architecture enables true multi-user, multi-order support! 🎉**
