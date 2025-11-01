# 🌮 Start Here - Tacos Ordering API

## What Is This?

A modern, fully-typed TypeScript API for managing taco orders with:
- ✅ **Multiple concurrent orders** (each with isolated state)
- ✅ **Hidden session management** (automatic, transparent)
- ✅ **Edit/remove tacos** for specific orders
- ✅ **Clean REST API** with no session endpoints
- ✅ **Slack bot integration** (optional)

## Quick Start (5 Minutes)

### 1. Install & Run
```bash
npm install
npm run dev:api
```

### 2. Make a Request
```bash
curl -X POST http://localhost:4000/api/v1/cart/tacos \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [{"id": "viande_hachee", "quantity": 2}],
    "sauces": ["harissa"],
    "garnitures": ["salade"]
  }' -v
```

### 3. Save the Session ID
Look at the response header:
```
X-Session-Id: 550e8400-e29b-41d4-a716-446655440000
```

### 4. Use It
```bash
SESSION_ID="550e8400-e29b-41d4-a716-446655440000"

# Get cart
curl http://localhost:4000/api/v1/cart -H "X-Session-Id: $SESSION_ID"

# Edit taco
curl -X PUT http://localhost:4000/api/v1/cart/tacos/0 \
  -H "X-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"size":"tacos_XXL","meats":[{"id":"viande_hachee","quantity":3}],"sauces":["harissa"],"garnitures":["salade"]}'

# Remove taco
curl -X DELETE http://localhost:4000/api/v1/cart/tacos/0 \
  -H "X-Session-Id: $SESSION_ID"
```

## API Endpoints

Simple, clean URLs (no `/sessions/` prefix):

```
GET    /api/v1/cart              → Get cart
POST   /api/v1/cart/tacos        → Add taco
PUT    /api/v1/cart/tacos/:id    → Edit taco
DELETE /api/v1/cart/tacos/:id    → Remove taco
POST   /api/v1/cart/extras       → Add extra
POST   /api/v1/cart/drinks       → Add drink
POST   /api/v1/cart/desserts     → Add dessert
POST   /api/v1/orders            → Place order
GET    /api/v1/resources/stock   → Get stock
```

## How Sessions Work

### Automatic & Transparent
1. **No session ID?** → Server generates one
2. **Session ID returned** in `X-Session-Id` header
3. **Client saves it** and includes in future requests
4. **That's it!** No session endpoints, no manual creation

### Multiple Orders
Each client can have their own session:
```javascript
const apiA = new TacosAPI();  // Auto-creates session A
const apiB = new TacosAPI();  // Auto-creates session B
// No conflicts!
```

## Documentation

### 📖 Essential Reading
1. **[QUICK_START_HIDDEN_SESSIONS.md](./QUICK_START_HIDDEN_SESSIONS.md)** ⭐ **Start here!**
   - 5-minute quick start
   - JavaScript examples
   - How sessions work

2. **[HIDDEN_SESSIONS.md](./HIDDEN_SESSIONS.md)** ⭐ **Complete guide**
   - Full architecture explanation
   - Client implementation examples (JS, Python, React)
   - Best practices

### 📚 Additional Resources
3. **[TYPESCRIPT_README.md](./TYPESCRIPT_README.md)** - General TypeScript app docs
4. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Backend API reference
5. **[examples/hidden-session-usage.ts](./examples/hidden-session-usage.ts)** - Working code

### 🗂️ Background (Optional)
- **[SESSION_ARCHITECTURE.md](./SESSION_ARCHITECTURE.md)** - Old explicit session docs (outdated)
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - What changed
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Project overview

## JavaScript Client Example

```javascript
class TacosAPI {
  constructor() {
    this.sessionId = localStorage.getItem('tacosSessionId');
    this.baseUrl = 'http://localhost:4000/api/v1';
  }

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Save session ID
    const sessionId = response.headers.get('X-Session-Id');
    if (sessionId) {
      this.sessionId = sessionId;
      localStorage.setItem('tacosSessionId', sessionId);
    }

    return response.json();
  }

  addTaco(taco) { return this.request('POST', '/cart/tacos', taco); }
  getCart() { return this.request('GET', '/cart'); }
  updateTaco(id, taco) { return this.request('PUT', `/cart/tacos/${id}`, taco); }
  deleteTaco(id) { return this.request('DELETE', `/cart/tacos/${id}`); }
  placeOrder(order) { return this.request('POST', '/orders', order); }
}

// Usage
const api = new TacosAPI();
await api.addTaco({ size: 'tacos_XL', meats: [...], sauces: [...], garnitures: [...] });
await api.getCart();
await api.updateTaco(0, { /* updated taco */ });
await api.deleteTaco(0);
```

## Architecture Highlights

### Hidden Sessions ✨
- **No session endpoints** - sessions are implementation detail
- **Auto-created** on first request
- **UUID-based** - secure and unpredictable
- **24-hour TTL** with automatic cleanup

### Per-Session State 🔐
- **Independent CSRF tokens** per session
- **Isolated cookies** per session
- **Separate cart** per session
- **No cross-contamination**

### Clean API 🎯
- **RESTful** endpoints
- **No `/sessions/` prefix**
- **Simple URLs**
- **Intuitive structure**

### Type Safety 💎
- **100% TypeScript**
- **Strict mode enabled**
- **Full IntelliSense**
- **Zero `any` types**

## Features

### Cart Management
- Add/edit/remove tacos
- Add extras, drinks, desserts
- Get cart summary
- Update quantities

### Order Management
- Place orders
- Track status
- Customer info
- Delivery scheduling

### Stock Management
- Real-time availability
- Out-of-stock tracking
- Automatic updates

### Multiple Orders
- Concurrent orders
- Session isolation
- No conflicts
- Scalable

## Project Structure

```
src/
├── api/
│   ├── client.ts              # Global HTTP client
│   └── session-client.ts      # Session-aware HTTP client
├── controllers/
│   └── api.controller.ts      # REST API handlers
├── middleware/
│   ├── session-handler.ts     # Auto session management ⭐
│   ├── validation.ts          # Request validation
│   └── error-handler.ts       # Error handling
├── services/
│   ├── session.service.ts     # Session management
│   ├── cart.service.ts        # Cart operations
│   ├── order.service.ts       # Order operations
│   └── resource.service.ts    # Stock operations
├── types/
│   ├── index.ts               # Core types
│   └── session.ts             # Session types
└── utils/
    ├── session-store.ts       # Session storage
    ├── logger.ts              # Logging
    └── errors.ts              # Custom errors
```

## Development

```bash
# Development mode (hot reload)
npm run dev:api

# Production build
npm run build
npm start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
```

## Environment

Copy `.env.example` to `.env`:

```bash
# Required
BACKEND_BASE_URL=https://your-backend.com

# Optional
WEB_API_ENABLED=true
WEB_API_PORT=4000
LOG_LEVEL=info
```

## Testing

```bash
# Run examples
npx ts-node examples/hidden-session-usage.ts

# Manual testing
npm run dev:api
# Then use curl or Postman
```

## Need Help?

1. **Quick start**: [QUICK_START_HIDDEN_SESSIONS.md](./QUICK_START_HIDDEN_SESSIONS.md)
2. **Full guide**: [HIDDEN_SESSIONS.md](./HIDDEN_SESSIONS.md)
3. **Examples**: [examples/hidden-session-usage.ts](./examples/hidden-session-usage.ts)
4. **Check logs**: `logs/combined.log`

## What Makes This Special?

### 🎯 Simple API
No session endpoints, no complexity. Just use it.

### 🔒 Secure
UUID-based sessions, per-session CSRF tokens, isolated state.

### 🚀 Scalable
Handles hundreds of concurrent orders, automatic cleanup.

### 💎 Type-Safe
100% TypeScript with strict types, IntelliSense everywhere.

### 📚 Well-Documented
Comprehensive docs, working examples, clear architecture.

### 🏗️ Clean Code
Service layer, controllers, middleware - proper separation of concerns.

---

**Ready to start? Read [QUICK_START_HIDDEN_SESSIONS.md](./QUICK_START_HIDDEN_SESSIONS.md)! 🚀**
