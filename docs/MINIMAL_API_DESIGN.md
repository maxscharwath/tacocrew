# Minimal API Design

Based on the analysis of the existing backend endpoints, here's a minimal REST API design that wraps the legacy PHP endpoints.

## Design Principles

1. **RESTful**: Use standard HTTP methods and status codes
2. **JSON**: All responses in JSON (no HTML)
3. **Resource-based**: Focus on resources (tacos, orders, cart)
4. **Simplified**: Combine related operations

## Base URL

```
/api/v1
```

## Authentication

All endpoints require CSRF token in header:
```
X-CSRF-Token: {token}
```

---

## Endpoints

### 1. Resources

#### `GET /api/v1/resources`
**Purpose**: List all available resources (viandes, sauces, garnitures, desserts, boissons, extras)

**Response**:
```json
{
  "viandes": [
    {
      "id": "viande_hachee",
      "name": "Viande Hachée",
      "category": "standard"
    }
  ],
  "sauces": [...],
  "garnitures": [...],
  "desserts": [...],
  "boissons": [...],
  "extras": [...]
}
```

**Backend**: Aggregates data from multiple sources

---

#### `GET /api/v1/resources/stock`
**Purpose**: Get stock availability for all products

**Response**:
```json
{
  "viandes": {
    "viande_hachee": { "in_stock": true }
  },
  "sauces": {...},
  "garnitures": {...},
  "desserts": {...},
  "boissons": {...},
  "extras": {...}
}
```

**Backend**: `GET /office/stock_management.php?type=all`

---

### 2. Cart

#### `GET /api/v1/cart`
**Purpose**: Get current cart contents

**Response**:
```json
{
  "tacos": [
    {
      "id": 0,
      "size": "tacos_XL",
      "meats": [
        { "id": "viande_hachee", "name": "Viande Hachée", "quantity": 2 }
      ],
      "sauces": [
        { "id": "harissa", "name": "Harissa" }
      ],
      "garnitures": [
        { "id": "salade", "name": "Salade" }
      ],
      "note": "Pas trop épicé",
      "quantity": 1,
      "price": 12.50
    }
  ],
  "extras": [...],
  "drinks": [...],
  "desserts": [...],
  "summary": {
    "totalQuantity": 5,
    "totalPrice": 40.50
  }
}
```

**Backend**: 
- `POST /ajax/owt.php` (loadProducts)
- `POST /ajax/gse.php`
- `POST /ajax/gsb.php`
- `POST /ajax/gsd.php`
- `POST /ajax/sd.php`

---

#### `POST /api/v1/cart/tacos`
**Purpose**: Add a taco to cart

**Request**:
```json
{
  "size": "tacos_XL",
  "meats": [
    { "id": "viande_hachee", "quantity": 2 }
  ],
  "sauces": ["harissa", "algérienne", "blanche"],
  "garnitures": ["salade", "tomates"],
  "note": "Pas trop épicé"
}
```

**Response**:
```json
{
  "success": true,
  "taco": {
    "id": 0,
    "size": "tacos_XL",
    "meats": [...],
    "sauces": [...],
    "garnitures": [...],
    "note": "Pas trop épicé",
    "quantity": 1,
    "price": 12.50
  }
}
```

**Backend**: `POST /ajax/owt.php` (add taco)

---

#### `GET /api/v1/cart/tacos/:id`
**Purpose**: Get taco details

**Response**:
```json
{
  "id": 0,
  "size": "tacos_XL",
  "meats": [...],
  "sauces": [...],
  "garnitures": [...],
  "note": "Pas trop épicé"
}
```

**Backend**: `POST /ajax/gtd.php`

---

#### `PUT /api/v1/cart/tacos/:id`
**Purpose**: Update a taco in cart

**Request**:
```json
{
  "size": "tacos_XL",
  "meats": [
    { "id": "viande_hachee", "quantity": 2 }
  ],
  "sauces": ["harissa"],
  "garnitures": ["salade"],
  "note": "Updated note"
}
```

**Response**:
```json
{
  "success": true,
  "taco": {...}
}
```

**Backend**: `POST /ajax/et.php`

---

#### `PATCH /api/v1/cart/tacos/:id/quantity`
**Purpose**: Update taco quantity

**Request**:
```json
{
  "action": "increase" | "decrease"
}
```

**Response**:
```json
{
  "success": true,
  "quantity": 2
}
```

**Backend**: `POST /ajax/owt.php` (action=increaseQuantity/decreaseQuantity)

---

#### `DELETE /api/v1/cart/tacos/:id`
**Purpose**: Remove taco from cart

**Response**:
```json
{
  "success": true
}
```

**Backend**: `POST /ajax/dt.php`

---

#### `POST /api/v1/cart/extras`
**Purpose**: Add or update extra in cart

**Request**:
```json
{
  "id": "extra_frites",
  "quantity": 2,
  "free_sauces": [
    { "id": "ketchup" }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "extra": {
    "id": "extra_frites",
    "name": "Frites",
    "price": 3.50,
    "quantity": 2,
    "free_sauces": [...]
  }
}
```

**Backend**: `POST /ajax/ues.php`

---

#### `POST /api/v1/cart/drinks`
**Purpose**: Add or update drink in cart

**Request**:
```json
{
  "id": "boisson_coca",
  "quantity": 2
}
```

**Response**:
```json
{
  "success": true,
  "drink": {
    "id": "boisson_coca",
    "name": "Coca Cola",
    "price": 2.50,
    "quantity": 2
  }
}
```

**Backend**: `POST /ajax/ubs.php`

---

#### `POST /api/v1/cart/desserts`
**Purpose**: Add or update dessert in cart

**Request**:
```json
{
  "id": "dessert_brownie",
  "quantity": 1
}
```

**Response**:
```json
{
  "success": true,
  "dessert": {
    "id": "dessert_brownie",
    "name": "Brownie",
    "price": 4.00,
    "quantity": 1
  }
}
```

**Backend**: `POST /ajax/uds.php`

---

### 3. Orders

#### `POST /api/v1/orders`
**Purpose**: Create and submit an order

**Request**:
```json
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

**Response**:
```json
{
  "success": true,
  "order": {
    "orderId": "1234567890_abc123",
    "status": "pending",
    "type": "livraison",
    "date": "2024-01-15T14:30:00Z",
    "price": 40.50,
    "requestedFor": "15:00"
  }
}
```

**Error Responses**:
- `409`: Duplicate order
- `403`: Rate limit exceeded (1 order per minute)
- `400`: Validation error

**Backend**: `POST /ajax/RocknRoll.php`

---

#### `GET /api/v1/orders/:id`
**Purpose**: Get order details

**Response**:
```json
{
  "orderId": "1234567890_abc123",
  "status": "confirmed",
  "type": "livraison",
  "date": "2024-01-15T14:30:00Z",
  "price": 40.50,
  "requestedFor": "15:00",
  "items": {
    "tacos": [...],
    "extras": [...],
    "drinks": [...],
    "desserts": [...]
  }
}
```

**Backend**: Uses localStorage data + `POST /ajax/oh.php` for status

---

#### `GET /api/v1/orders/:id/status`
**Purpose**: Get order status only

**Response**:
```json
{
  "orderId": "1234567890_abc123",
  "status": "confirmed",
  "updatedAt": "2024-01-15T14:31:00Z"
}
```

**Backend**: `POST /ajax/oh.php`

---

#### `POST /api/v1/orders/:id/restore`
**Purpose**: Restore order to cart (repeat order)

**Response**:
```json
{
  "success": true,
  "warnings": {
    "out_of_stock": [
      "Product Name 1",
      "Product Name 2"
    ]
  }
}
```

**Backend**: `POST /ajax/restore_order.php`

---

#### `GET /api/v1/orders`
**Purpose**: List user orders (from localStorage)

**Query Parameters**:
- `limit`: Number of orders (default: 3)

**Response**:
```json
{
  "orders": [
    {
      "orderId": "1234567890_abc123",
      "status": "confirmed",
      "date": "2024-01-15T14:30:00Z",
      "price": 40.50
    }
  ]
}
```

**Backend**: `localStorage.getItem('order_stories')` + `POST /ajax/oh.php`

---

### 4. Delivery

#### `GET /api/v1/delivery/time-slots`
**Purpose**: Get available time slots with demand info

**Response**:
```json
{
  "slots": [
    {
      "time": "15:00",
      "available": true,
      "highDemand": false
    },
    {
      "time": "16:00",
      "available": true,
      "highDemand": true
    }
  ]
}
```

**Backend**: `POST /ajax/check_delivery_demand.php` (check_all)

---

#### `GET /api/v1/delivery/demand/:time`
**Purpose**: Check delivery demand for specific time

**Response**:
```json
{
  "time": "15:00",
  "isHighDemand": true,
  "message": "Forte affluence à cette heure"
}
```

**Backend**: `POST /ajax/check_delivery_demand.php`

---

## Implementation Notes

### Request Transformation

**Adding Taco**:
```javascript
// API Request
POST /api/v1/cart/tacos
{
  "size": "tacos_XL",
  "meats": [{ "id": "viande_hachee", "quantity": 2 }],
  "sauces": ["harissa"]
}

// Transformed to Backend
POST /ajax/owt.php
Content-Type: application/x-www-form-urlencoded
selectProduct=tacos_XL
viande[]=viande_hachee
meat_quantity[viande_hachee]=2
sauce[]=harissa
```

### Response Transformation

**Cart Response**:
```javascript
// Backend Response (HTML)
"<div class='card'>...</div>"

// Transformed to API Response
{
  "success": true,
  "taco": {
    "id": 0,
    "size": "tacos_XL",
    ...
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "Maximum 1 order per minute",
    "details": {}
  }
}
```

**Error Codes**:
- `CSRF_INVALID`: CSRF token invalid or expired
- `RATE_LIMIT`: Rate limit exceeded
- `DUPLICATE_ORDER`: Order already exists
- `VALIDATION_ERROR`: Input validation failed
- `OUT_OF_STOCK`: Product out of stock
- `NOT_FOUND`: Resource not found

---

## Status Codes

- `200`: Success
- `201`: Created (order created)
- `400`: Bad Request (validation error)
- `403`: Forbidden (CSRF, rate limit)
- `404`: Not Found
- `409`: Conflict (duplicate order)
- `500`: Server Error

---

## Rate Limiting

- **Order Submission**: 1 per minute
- **Other Endpoints**: No limit (inherited from backend)

---

## Example Usage

```javascript
// Initialize API client
const api = new TacosAPI('https://api.tacos.com/v1');

// Get resources
const resources = await api.get('/resources');
console.log(resources.viandes);

// Add taco to cart
const taco = await api.post('/cart/tacos', {
  size: 'tacos_XL',
  meats: [{ id: 'viande_hachee', quantity: 2 }],
  sauces: ['harissa', 'algérienne'],
  garnitures: ['salade', 'tomates']
});

// Get cart
const cart = await api.get('/cart');
console.log(cart.summary.totalPrice);

// Submit order
const order = await api.post('/orders', {
  customer: {
    name: 'John Doe',
    phone: '+41791234567'
  },
  delivery: {
    type: 'livraison',
    address: '123 Rue Example, 1000 Lausanne',
    requestedFor: '15:00'
  }
});
console.log(order.order.orderId);
```
