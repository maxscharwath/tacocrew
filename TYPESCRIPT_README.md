# 🌮 Tacos Ordering API - TypeScript Application

A modern, fully-typed TypeScript application that wraps the legacy PHP tacos ordering backend with clean architecture, providing both Slack bot and REST API interfaces.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Slack Bot Commands](#slack-bot-commands)
- [Development](#development)
- [Project Structure](#project-structure)
- [Type Safety](#type-safety)

## ✨ Features

### Core Features
- 🔐 **CSRF Token Management** - Automatic CSRF token refresh and handling
- 🛒 **Cart Management** - Full cart operations (add, update, delete items)
- 📦 **Order Management** - Create and track orders
- 📊 **Stock Monitoring** - Real-time product availability
- ⏰ **Delivery Scheduling** - Time slot selection with demand tracking

### Integration Options
- 🤖 **Slack Bot** - Order tacos directly from Slack
- 🌐 **REST API** - Full RESTful API with OpenAPI-ready endpoints
- 🔄 **Dual Mode** - Run both Slack bot and Web API simultaneously

### Developer Experience
- 💎 **Fully Typed** - 100% TypeScript with strict type checking
- 🏗️ **Clean Architecture** - Service layer, controllers, middleware separation
- 📝 **Well Documented** - JSDoc comments throughout
- 🔍 **ESLint & Prettier** - Code quality and formatting
- 🚀 **Hot Reload** - Fast development with ts-node-dev
- 📊 **Logging** - Structured logging with Winston

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│         (Slack Bot / REST API / Web Frontend)           │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                  Controllers Layer                       │
│         (Request Handling & Validation)                 │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                   Services Layer                         │
│        (Business Logic & Data Transformation)           │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    API Client                            │
│         (HTTP Client with CSRF Handling)                │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                  Legacy PHP Backend                      │
│              (Existing Tacos System)                    │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Controllers**: Handle HTTP requests, validate input, format responses
- **Services**: Implement business logic, coordinate API calls
- **API Client**: Manage backend communication, CSRF tokens, error handling
- **Types**: Provide type safety across all layers

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **TypeScript** knowledge
- Access to the legacy PHP backend
- (Optional) Slack workspace for bot integration

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd workspace

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## ⚙️ Configuration

Create a `.env` file based on `.env.example`:

```bash
# Backend API Configuration (Required)
BACKEND_BASE_URL=https://your-tacos-backend.com
BACKEND_TIMEOUT=30000
CSRF_REFRESH_INTERVAL=1800000

# Slack Bot Configuration (Optional)
SLACK_ENABLED=false
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_PORT=3000

# Web API Configuration (Optional)
WEB_API_ENABLED=true
WEB_API_PORT=4000
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Environment
NODE_ENV=development
```

### Slack Bot Setup

If you want to enable the Slack bot:

1. Create a Slack app at https://api.slack.com/apps
2. Enable Socket Mode
3. Add bot token scopes: `commands`, `chat:write`, `app_mentions:read`
4. Create slash commands: `/order-taco`, `/view-cart`, `/checkout`, `/order-status`, `/stock`
5. Install the app to your workspace
6. Copy the tokens to your `.env` file

## 🚀 Usage

### Development Mode

```bash
# Run both Slack bot and Web API
npm run dev

# Run only Slack bot
npm run dev:slack

# Run only Web API
npm run dev:api
```

### Production Mode

```bash
# Build TypeScript to JavaScript
npm run build

# Start all enabled services
npm start

# Or start specific services
npm run start:slack
npm run start:api
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## 📖 API Documentation

### Base URL
```
http://localhost:4000/api/v1
```

### Endpoints

#### Cart Management

**Get Cart**
```http
GET /api/v1/cart
```

**Add Taco to Cart**
```http
POST /api/v1/cart/tacos
Content-Type: application/json

{
  "size": "tacos_XL",
  "meats": [
    { "id": "viande_hachee", "quantity": 2 }
  ],
  "sauces": ["harissa", "algérienne"],
  "garnitures": ["salade", "tomates"],
  "note": "Pas trop épicé"
}
```

**Update Taco Quantity**
```http
PATCH /api/v1/cart/tacos/:id/quantity
Content-Type: application/json

{
  "action": "increase"
}
```

**Delete Taco**
```http
DELETE /api/v1/cart/tacos/:id
```

**Add Extra**
```http
POST /api/v1/cart/extras
Content-Type: application/json

{
  "id": "extra_frites",
  "name": "Frites",
  "price": 3.50,
  "quantity": 2,
  "free_sauces": [
    { "id": "ketchup", "name": "Ketchup", "price": 0 }
  ]
}
```

**Add Drink**
```http
POST /api/v1/cart/drinks
Content-Type: application/json

{
  "id": "boisson_coca",
  "name": "Coca Cola",
  "price": 2.50,
  "quantity": 1
}
```

**Add Dessert**
```http
POST /api/v1/cart/desserts
Content-Type: application/json

{
  "id": "dessert_brownie",
  "name": "Brownie",
  "price": 4.00,
  "quantity": 1
}
```

#### Order Management

**Create Order**
```http
POST /api/v1/orders
Content-Type: application/json

{
  "customer": {
    "name": "John Doe",
    "phone": "+41791234567"
  },
  "delivery": {
    "type": "livraison",
    "address": "123 Rue Example, 1000 Lausanne",
    "requestedFor": "15:00"
  }
}
```

**Get Order Status**
```http
GET /api/v1/orders/:orderId/status
```

#### Resources

**Get Stock Availability**
```http
GET /api/v1/resources/stock
```

#### Delivery

**Get Time Slots**
```http
GET /api/v1/delivery/time-slots
```

**Check Delivery Demand**
```http
GET /api/v1/delivery/demand/:time
```

### Response Format

All endpoints return responses in this format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## 🤖 Slack Bot Commands

### Available Commands

- **`/order-taco [SIZE]`** - Add a taco to your cart
  ```
  /order-taco XL
  ```

- **`/view-cart`** - View your current cart contents
  ```
  /view-cart
  ```

- **`/checkout [name] [phone] [type] [time] [address]`** - Place an order
  ```
  /checkout "John Doe" +41791234567 livraison 15:00 "123 Rue Example"
  ```

- **`/order-status [orderId]`** - Check order status
  ```
  /order-status 1234567890_abc123
  ```

- **`/stock`** - Check product availability
  ```
  /stock
  ```

### Taco Sizes

- **L** - Small (1 meat)
- **BOWL** - Bowl style (2 meats, no garnitures)
- **L_MIXTE** - Mixed Large (3 meats)
- **XL** - Large (3 meats)
- **XXL** - Extra Large (4 meats)
- **GIGA** - Giant (5 meats)

## 🔧 Development

### Project Structure

```
workspace/
├── src/
│   ├── api/
│   │   └── client.ts           # HTTP client with CSRF handling
│   ├── config/
│   │   └── index.ts            # Configuration management
│   ├── controllers/
│   │   ├── api.controller.ts   # REST API controllers
│   │   └── slack.controller.ts # Slack bot controllers
│   ├── middleware/
│   │   ├── error-handler.ts    # Global error handling
│   │   └── validation.ts       # Request validation (Joi)
│   ├── services/
│   │   ├── cart.service.ts     # Cart business logic
│   │   ├── order.service.ts    # Order business logic
│   │   └── resource.service.ts # Resource/stock management
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── utils/
│   │   ├── errors.ts           # Custom error classes
│   │   └── logger.ts           # Winston logger
│   ├── index.ts                # Main entry point
│   ├── slack-bot.ts            # Slack bot entry point
│   └── web-api.ts              # Web API entry point
├── logs/                       # Application logs
├── dist/                       # Compiled JavaScript (gitignored)
├── .env                        # Environment variables (gitignored)
├── .env.example                # Environment template
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── .eslintrc.json              # ESLint configuration
├── .prettierrc.json            # Prettier configuration
└── TYPESCRIPT_README.md        # This file
```

### Adding New Features

1. **Define Types**: Add type definitions in `src/types/index.ts`
2. **Create Service**: Implement business logic in `src/services/`
3. **Add Controller**: Create controller methods in `src/controllers/`
4. **Add Routes**: Register routes in `src/web-api.ts`
5. **Add Validation**: Define Joi schemas in `src/middleware/validation.ts`

### Type Safety

The project uses strict TypeScript configuration:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

All API interactions are fully typed, providing:
- IntelliSense/autocomplete
- Compile-time error detection
- Self-documenting code

### Error Handling

The application uses custom error classes for different scenarios:

- `CsrfError` - CSRF token issues
- `RateLimitError` - Rate limiting
- `DuplicateOrderError` - Duplicate orders
- `ValidationError` - Input validation
- `OutOfStockError` - Stock issues
- `NotFoundError` - Resource not found
- `NetworkError` - Network failures

Example:
```typescript
import { ValidationError } from './utils/errors';

if (!isValid) {
  throw new ValidationError('Invalid input', { field: 'size' });
}
```

## 📊 Logging

Logs are written to:
- Console (formatted for development)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

Log levels: error, warn, info, debug

Configure via `LOG_LEVEL` environment variable.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Watch mode
npm run test:watch
```

## 🚢 Deployment

### Build for Production

```bash
# Build TypeScript
npm run build

# Set production environment
export NODE_ENV=production

# Start services
npm start
```

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

## 🤝 Contributing

1. Follow the existing code style
2. Run linter: `npm run lint:fix`
3. Run formatter: `npm run format`
4. Ensure type checking passes: `npm run type-check`

## 📝 License

MIT

## 🔗 Related Documentation

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete backend API reference
- [MINIMAL_API_DESIGN.md](./MINIMAL_API_DESIGN.md) - API design principles
- [BACKEND_API_DOCUMENTATION.md](./BACKEND_API_DOCUMENTATION.md) - Legacy backend details

## 💡 Tips & Best Practices

### Performance
- Stock data is cached for 30 seconds to reduce backend load
- CSRF token auto-refreshes every 30 minutes
- Rate limiting protects against abuse (100 req/min by default)

### Security
- Helmet.js for HTTP security headers
- Request validation with Joi
- CSRF protection
- Rate limiting

### Monitoring
- Structured JSON logging
- Request/response logging
- Error tracking with stack traces

## 🐛 Troubleshooting

### CSRF Token Errors
If you see CSRF errors, the token will auto-refresh. If issues persist:
- Check `BACKEND_BASE_URL` is correct
- Ensure backend is accessible
- Check network connectivity

### Slack Bot Not Responding
- Verify Slack tokens in `.env`
- Ensure Socket Mode is enabled
- Check bot is installed in workspace
- Review logs for errors

### Type Errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

## 📞 Support

For issues or questions, refer to:
- Application logs in `logs/` directory
- Backend API documentation
- TypeScript documentation
