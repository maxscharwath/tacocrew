# Mock Backend Server

A lightweight mock server for testing the backend API integration without requiring the real backend.

## Usage

Start the mock server:

```bash
pnpm mock:server
```

The server will start on port `3001` by default.

## Configuration

To use the mock server instead of the real backend, set the `BACKEND_BASE_URL` environment variable:

```bash
BACKEND_BASE_URL=http://localhost:3001
```

## Endpoints

The mock server implements the following endpoints:

### Homepage
- `GET /` - Returns HTML homepage (for session initialization)

### CSRF Token
- `GET /index.php?content=livraison` - Returns HTML with CSRF token embedded

### Stock Management
- `GET /office/stock_management.php?type=all` - Returns mock stock data

### Cart Operations
- `POST /ajax/owt.php` - Add taco to cart (returns `OK`)
- `POST /ajax/ues.php` - Add extra to cart (returns `OK`)
- `POST /ajax/ubs.php` - Add drink to cart (returns `OK`)
- `POST /ajax/uds.php` - Add dessert to cart (returns `OK`)

### Order Submission
- `POST /ajax/RocknRoll.php` - Submit order (returns order ID and order data)

## Example Response

### Stock Management
```json
{
  "viandes": {
    "viande_hachee": { "name": "Viande Hachée", "price": 5.0, "in_stock": true },
    "escalope_de_poulet": { "name": "Escalope de Poulet", "price": 6.0, "in_stock": true }
  },
  "sauces": {
    "harissa": { "name": "Harissa", "price": 0, "in_stock": true }
  },
  "garnitures": {
    "salade": { "name": "Salade", "price": 0, "in_stock": true }
  },
  "extras": {
    "extra_frites": { "name": "Frites", "price": 3.5, "in_stock": true }
  },
  "boissons": {
    "boisson_coca": { "name": "Coca Cola", "price": 2.5, "in_stock": true }
  },
  "desserts": {
    "dessert_brownie": { "name": "Brownie", "price": 4.0, "in_stock": true }
  }
}
```

### Order Submission
```json
{
  "orderId": "order_1234567890",
  "OrderData": {
    "status": "pending",
    "type": "livraison",
    "date": "2024-01-01T12:00:00.000Z",
    "price": 40.5,
    "requestedFor": "15:00"
  }
}
```

## Testing

You can use this mock server for:
- Integration testing
- Development without backend access
- CI/CD pipelines
- Local development

## Customization

To customize the mock server behavior, edit `src/mock-server/mock-backend.server.ts`:
- Modify response data
- Add custom endpoints
- Simulate errors
- Add delays for testing timeouts

