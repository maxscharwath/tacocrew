# 🚀 Quick Start Guide

Get up and running with the Tacos Ordering API in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your settings (minimum required: BACKEND_BASE_URL)
nano .env
```

**Minimum Configuration:**
```bash
BACKEND_BASE_URL=https://your-backend.com
WEB_API_ENABLED=true
```

## Step 3: Start the Application

### Option A: Web API Only (Recommended for testing)

```bash
npm run dev:api
```

The API will be available at `http://localhost:4000`

### Option B: Slack Bot Only

```bash
# First, configure Slack tokens in .env
SLACK_ENABLED=true
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...

# Then start
npm run dev:slack
```

### Option C: Both Services

```bash
npm run dev
```

## Step 4: Test the API

### Health Check
```bash
curl http://localhost:4000/health
```

### Get Stock Information
```bash
curl http://localhost:4000/api/v1/resources/stock
```

### Add Taco to Cart
```bash
curl -X POST http://localhost:4000/api/v1/cart/tacos \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [{"id": "viande_hachee", "quantity": 2}],
    "sauces": ["harissa"],
    "garnitures": ["salade"]
  }'
```

### View Cart
```bash
curl http://localhost:4000/api/v1/cart
```

### Create Order
```bash
curl -X POST http://localhost:4000/api/v1/orders \
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

## Step 5: Development Workflow

### Run with Hot Reload
```bash
npm run dev:api
# or
npm run dev:slack
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Formatting
```bash
npm run format
```

## Common Issues

### Port Already in Use
```bash
# Change port in .env
WEB_API_PORT=5000
```

### Backend Connection Issues
- Verify `BACKEND_BASE_URL` is correct
- Check if backend is accessible
- Look at logs in `logs/` folder

### TypeScript Errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

## Next Steps

- Read [TYPESCRIPT_README.md](./TYPESCRIPT_README.md) for full documentation
- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for backend API details
- Explore the code in `src/` directory
- Add custom features in `src/services/`

## Production Deployment

```bash
# Build for production
npm run build

# Set environment
export NODE_ENV=production

# Start
npm start
```

## Need Help?

- Check application logs: `logs/combined.log`
- Review error logs: `logs/error.log`
- Read the full documentation: [TYPESCRIPT_README.md](./TYPESCRIPT_README.md)
