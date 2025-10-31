# Backend API Documentation

## Overview

This document describes the **actual backend endpoints** used by the tacos ordering system, based on analysis of the frontend code (`bundle.js`).

## Base URL

All endpoints are prefixed with `/ajax/` except where noted.

## Authentication

All endpoints require a CSRF token in the `X-CSRF-Token` header. The token is obtained from the page (`input[name="csrf_token"]`) or refreshed via `/ajax/refresh_token.php`.

---

## Endpoints Reference

### 1. Authentication

#### `GET /ajax/refresh_token.php`
**Purpose**: Refresh CSRF token

**Request**:
- Method: GET
- Headers: None
- Body: None

**Response**:
```json
{
  "csrf_token": "token_string"
}
```

**Notes**:
- Called every 30 minutes (1800000ms)
- Returns 403 on error

---

### 2. Cart Management - Tacos

#### `POST /ajax/owt.php` (Add Taco)
**Purpose**: Add a new taco to the cart

**Request**:
- Method: POST
- Headers: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}`
- Body (URL-encoded):
  ```
  selectProduct={tacoSize}
  viande[]={meat1}
  viande[]={meat2}
  sauce[]={sauce1}
  sauce[]={sauce2}
  sauce[]={sauce3}
  garniture[]={garnish1}
  garniture[]={garnish2}
  tacosNote={optional_note}
  meat_quantity[{meatSlug}]={quantity}
  ```

**Response**: HTML string (taco card HTML for display)

**Taco Sizes**:
- `tacos_L` - 1 meat max
- `tacos_BOWL` - 2 meats max, no garnitures
- `tacos_L_mixte` - 3 meats max
- `tacos_XL` - 3 meats max
- `tacos_XXL` - 4 meats max
- `tacos_GIGA` - 5 meats max

**Constraints**:
- Maximum 3 sauces
- At least 1 meat (or "sans_viande")
- At least 1 sauce (or "sans")
- At least 1 garniture (or "sans"), except for BOWL

---

#### `POST /ajax/owt.php` (Update Quantity)
**Purpose**: Increase or decrease taco quantity in cart

**Request**:
- Method: POST
- Headers: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}`
- Body (URL-encoded):
  ```
  action=increaseQuantity|decreaseQuantity
  index={tacoIndex}
  ```

**Response**:
```json
{
  "status": "success",
  "quantity": 2
}
```

---

#### `POST /ajax/owt.php` (Load Products)
**Purpose**: Get all tacos currently in cart

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body (JSON):
  ```json
  {
    "loadProducts": true
  }
  ```

**Response**: HTML string (all taco cards)

---

#### `POST /ajax/gtd.php`
**Purpose**: Get details of a specific taco for editing

**Request**:
- Method: POST
- Headers: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}`
- Body (URL-encoded):
  ```
  index={tacoIndex}
  ```

**Response**:
```json
{
  "status": "success",
  "data": {
    "taille": "tacos_XL",
    "viande": [
      {
        "slug": "viande_hachee",
        "quantity": 2,
        "name": "Viande Hachée"
      }
    ],
    "garniture": [
      {
        "slug": "salade",
        "name": "Salade"
      }
    ],
    "sauce": [
      {
        "slug": "harissa",
        "name": "Harissa"
      }
    ],
    "tacosNote": "Pas trop épicé"
  }
}
```

**Error**: Returns 403 on CSRF failure

---

#### `POST /ajax/et.php`
**Purpose**: Update an existing taco in cart

**Request**:
- Method: POST
- Headers: 
  - `Content-Type: multipart/form-data`
  - `X-CSRF-Token: {token}`
- Body (FormData):
  ```
  editSelectProduct={tacoSize}
  viande[]={meat1}
  sauce[]={sauce1}
  garniture[]={garnish1}
  tacosNote={note}
  meat_quantity[{meatSlug}]={quantity}
  ```

**Response**: HTML string (updated taco card)

---

#### `POST /ajax/dt.php`
**Purpose**: Delete a taco from cart

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body (JSON):
  ```json
  {
    "index": 0
  }
  ```

**Response**: Success status (used to remove DOM element)

---

### 3. Cart Management - Extras

#### `POST /ajax/ues.php`
**Purpose**: Add or update an extra item (frites, nuggets, etc.) in cart

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body (JSON):
  ```json
  {
    "id": "extra_frites",
    "name": "Frites",
    "price": 3.50,
    "quantity": 2,
    "free_sauce": {
      "id": "sauce_id",
      "name": "Sauce",
      "price": 0
    },
    "free_sauces": [
      {
        "id": "sauce1",
        "name": "Sauce 1",
        "price": 0
      },
      {
        "id": "sauce2",
        "name": "Sauce 2",
        "price": 0
      }
    ]
  }
  ```

**Response**: JSON status (triggers cart refresh)

**Extras with Free Sauces**:
- `extra_frites`
- `extra_nuggets`
- `extra_falafel`
- `extra_tenders`
- `extra_onion_rings`
- `extra_pommes_gaufrettes`
- `extra_mozarella_sticks`
- `extra_potatoes`
- `extra_gaufrettes`

---

#### `POST /ajax/gse.php`
**Purpose**: Get all extras currently in cart

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body: None

**Response**:
```json
{
  "extra_frites": {
    "id": "extra_frites",
    "quantity": 2,
    "free_sauce": {
      "id": "ketchup",
      "name": "Ketchup"
    },
    "free_sauces": [
      {
        "id": "ketchup",
        "name": "Ketchup"
      }
    ]
  }
}
```

**Error**: Returns 403 on CSRF failure

---

### 4. Cart Management - Drinks

#### `POST /ajax/ubs.php`
**Purpose**: Add or update a drink in cart

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body (JSON):
  ```json
  {
    "id": "boisson_coca",
    "name": "Coca Cola",
    "price": 2.50,
    "quantity": 1
  }
  ```

**Response**: JSON status (triggers cart refresh)

---

#### `POST /ajax/gsb.php`
**Purpose**: Get all drinks currently in cart

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body: None

**Response**:
```json
{
  "boisson_coca": {
    "id": "boisson_coca",
    "quantity": 2
  }
}
```

**Error**: Returns 403 on CSRF failure

---

### 5. Cart Management - Desserts

#### `POST /ajax/uds.php`
**Purpose**: Add or update a dessert in cart

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body (JSON):
  ```json
  {
    "id": "dessert_brownie",
    "name": "Brownie",
    "price": 4.00,
    "quantity": 1
  }
  ```

**Response**: JSON status (triggers cart refresh)

---

#### `POST /ajax/gsd.php`
**Purpose**: Get all desserts currently in cart

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body: None

**Response**:
```json
{
  "dessert_brownie": {
    "id": "dessert_brownie",
    "quantity": 1
  }
}
```

**Error**: Returns 403 on CSRF failure

---

### 6. Cart Summary

#### `POST /ajax/cs.php`
**Purpose**: Get HTML summary of cart (for display)

**Request**:
- Method: POST
- Headers: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}`
- Body (URL-encoded): None (empty)

**Response**:
```json
{
  "message": "<div>Cart HTML summary...</div>"
}
```

**Error**: Returns 403 on CSRF failure

---

#### `POST /ajax/sd.php`
**Purpose**: Get summary by category (quantities and prices)

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body: None

**Response**:
```json
{
  "tacos": {
    "totalQuantity": 3,
    "totalPrice": 24.50
  },
  "extras": {
    "totalQuantity": 2,
    "totalPrice": 7.00
  },
  "boissons": {
    "totalQuantity": 2,
    "totalPrice": 5.00
  },
  "desserts": {
    "totalQuantity": 1,
    "totalPrice": 4.00
  }
}
```

**Error**: Returns 403 on CSRF failure

---

### 7. Orders

#### `POST /ajax/RocknRoll.php`
**Purpose**: Submit and finalize an order

**Request**:
- Method: POST
- Headers: 
  - `Content-Type: multipart/form-data`
  - `X-CSRF-Token: {token}`
- Body (FormData):
  ```
  name={customer_name}
  phone={phone_number}
  confirmPhone={confirm_phone}
  address={delivery_address}
  type={livraison|emporter}
  requestedFor={time_slot}
  transaction_id={unique_id}
  ```
  
**Transaction ID Format**: `{timestamp}_{random_string}` (e.g., `1234567890_abc123`)

**Response**:
```json
{
  "orderId": "1234567890_abc123",
  "OrderData": {
    "status": "pending",
    "type": "livraison",
    "date": "2024-01-15 14:30:00",
    "price": 40.50,
    "requestedFor": "15:00"
  }
}
```

**Error Codes**:
- `409`: Duplicate order (same transaction_id)
- `403`: Rate limit exceeded or forbidden
  - Rate limit: 1 order per minute
  - Error message contains: "1 Order per minute" or "Maximum"

**Notes**:
- Phone numbers must match (phone === confirmPhone)
- Orders are stored in localStorage with key `order_stories`
- Order statuses: `pending`, `confirmed`, `ondelivery`, `delivered`, `cancelled`

---

#### `POST /ajax/oh.php`
**Purpose**: Check status of multiple orders

**Request**:
- Method: POST
- Headers: 
  - `Content-Type: application/json`
  - `X-CSRF-Token: {token}`
- Body (JSON):
  ```json
  {
    "orders": [
      {
        "orderId": "1234567890_abc123"
      },
      {
        "orderId": "1234567890_def456"
      }
    ]
  }
  ```

**Response**:
```json
[
  {
    "orderId": "1234567890_abc123",
    "status": "confirmed"
  },
  {
    "orderId": "1234567890_def456",
    "status": "delivered"
  }
]
```

**Error**: Returns 403 on CSRF failure, triggers page reload

**Notes**:
- Used to refresh order statuses in order history
- Polls every 15 seconds if there are active orders (pending, confirmed, ondelivery)
- Only shows last 3 orders

---

#### `POST /ajax/os.php`
**Purpose**: Get HTML summary of current cart for order modal

**Request**:
- Method: POST
- Headers: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}` (optional in header, also in body)
- Body (URL-encoded):
  ```
  csrf_token={token}
  ```

**Response**: HTML string (order summary for modal display)

**Error**: Returns 403 on CSRF failure

---

#### `POST /ajax/restore_order.php`
**Purpose**: Restore a previous order to cart (repeat order)

**Request**:
- Method: POST
- Headers: `X-CSRF-Token: {token}`
- Body (JSON):
  ```json
  {
    "order": {
      "orderId": "1234567890_abc123",
      "OrderData": {
        "tacos": [...],
        "extras": [...],
        "boissons": [...],
        "desserts": [...]
      }
    }
  }
  ```

**Response**:
```json
{
  "status": "success" | "warning",
  "out_of_stock_items": [
    "Product Name 1",
    "Product Name 2"
  ]
}
```

**Notes**:
- If status is "warning", some items were out of stock
- Out of stock items are listed in `out_of_stock_items` array
- On success, opens order modal automatically (via localStorage flag)

**Error**: Returns 403 on CSRF failure

---

### 8. Delivery

#### `POST /ajax/check_delivery_demand.php`
**Purpose**: Check if a time slot has high delivery demand

**Request**:
- Method: POST
- Headers: 
  - `Content-Type: application/json`
  - `X-CSRF-TOKEN: {token}`
- Body (single time):
  ```json
  {
    "time": "15:00"
  }
  ```
- Body (all times):
  ```json
  {
    "check_all": true
  }
  ```

**Response** (single time):
```json
{
  "status": "success",
  "is_high_demand": true,
  "message": "Forte affluence à cette heure"
}
```

**Response** (all times):
```json
{
  "status": "success",
  "time_slots": {
    "15:00": {
      "is_high_demand": true
    },
    "15:00:00": {
      "is_high_demand": true
    }
  }
}
```

**Notes**:
- Used to mark time slots with "Forte affluence" label
- Checks both "15:00" and "15:00:00" formats

---

### 9. Stock Management

#### `GET /office/stock_management.php?type=all`
**Purpose**: Get stock availability for all products

**Request**:
- Method: GET
- Headers: None
- Query: `type=all`

**Response**:
```json
{
  "viandes": {
    "viande_hachee": {
      "in_stock": true
    },
    "escalope_de_poulet": {
      "in_stock": false
    }
  },
  "sauces": {
    "harissa": {
      "in_stock": true
    }
  },
  "garnitures": {
    "salade": {
      "in_stock": true
    }
  },
  "desserts": {
    "dessert_brownie": {
      "in_stock": true
    }
  },
  "boissons": {
    "boisson_coca": {
      "in_stock": true
    }
  },
  "extras": {
    "extra_frites": {
      "in_stock": true
    }
  }
}
```

**Notes**:
- Cached for 30 seconds (30000ms)
- Used to disable out-of-stock items in UI

---

## Data Structures

### Taco Structure
```javascript
{
  size: "tacos_XL",
  meats: [
    {
      slug: "viande_hachee",
      name: "Viande Hachée",
      quantity: 2
    }
  ],
  sauces: [
    {
      slug: "harissa",
      name: "Harissa"
    }
  ],
  garnitures: [
    {
      slug: "salade",
      name: "Salade"
    }
  ],
  tacosNote: "Pas trop épicé",
  quantity: 1,
  price: 12.50
}
```

### Order Structure (from localStorage)
```javascript
{
  orderId: "1234567890_abc123",
  OrderData: {
    status: "pending", // pending, confirmed, ondelivery, delivered, cancelled
    type: "livraison", // livraison, emporter
    date: "2024-01-15 14:30:00",
    price: 40.50,
    requestedFor: "15:00",
    tacos: [...], // Array of taco objects
    extras: [...], // Array of extra objects
    boissons: [...], // Array of drink objects
    desserts: [...] // Array of dessert objects
  }
}
```

### Extra Structure
```javascript
{
  id: "extra_frites",
  name: "Frites",
  price: 3.50,
  quantity: 2,
  free_sauce: {
    id: "ketchup",
    name: "Ketchup",
    price: 0
  },
  free_sauces: [
    {
      id: "ketchup",
      name: "Ketchup",
      price: 0
    }
  ]
}
```

---

## Error Handling

### CSRF Token Errors
- Status: `403`
- Behavior: Reloads page or refreshes token
- Headers: `X-CSRF-Token` invalid or missing

### Rate Limiting
- Status: `403`
- Message: Contains "1 Order per minute" or "Maximum"
- Applies to: Order submission only

### Duplicate Orders
- Status: `409`
- Trigger: Same `transaction_id` submitted twice

---

## Session Management

Cart state is maintained server-side (likely via PHP sessions). The frontend:
- Stores order history in `localStorage` with key `order_stories`
- Stores accordion state in `localStorage` with key `accordionState`
- Stores modal state in `localStorage` with key `openOrderModal`

---

## Business Rules

1. **Taco Size Limits**:
   - L: 1 meat, 3 sauces max
   - BOWL: 2 meats, 3 sauces max, NO garnitures
   - L_mixte/XL: 3 meats, 3 sauces max
   - XXL: 4 meats, 3 sauces max
   - GIGA: 5 meats, 3 sauces max

2. **Order Restrictions**:
   - Minimum 1 meat (or "sans_viande")
   - Minimum 1 sauce (or "sans")
   - Minimum 1 garniture (or "sans"), except BOWL

3. **Delivery**:
   - Fee: 2.00 CHF for delivery orders
   - Time slots available with demand checking

4. **Order Status Flow**:
   - `pending` → `confirmed` → `ondelivery` → `delivered`
   - Can be `cancelled` at any point

5. **Rate Limiting**:
   - 1 order per minute per user

6. **Stock Management**:
   - Out-of-stock items are disabled in UI
   - Stock checked every 30 seconds

7. **Free Sauces**:
   - Certain extras include free sauces
   - Quantity of free sauces depends on extra quantity

---

## Endpoint Summary Table

| Endpoint | Method | Purpose | Request Format | Response Format |
|----------|--------|---------|----------------|-----------------|
| `refresh_token.php` | GET | Get CSRF token | None | JSON |
| `owt.php` | POST | Add/update/load tacos | Form/JSON | HTML/JSON |
| `gtd.php` | POST | Get taco details | Form | JSON |
| `et.php` | POST | Edit taco | FormData | HTML |
| `dt.php` | POST | Delete taco | JSON | JSON |
| `ues.php` | POST | Add/update extra | JSON | JSON |
| `gse.php` | POST | Get selected extras | None | JSON |
| `ubs.php` | POST | Add/update drink | JSON | JSON |
| `gsb.php` | POST | Get selected drinks | None | JSON |
| `uds.php` | POST | Add/update dessert | JSON | JSON |
| `gsd.php` | POST | Get selected desserts | None | JSON |
| `cs.php` | POST | Get cart summary | Form | JSON |
| `sd.php` | POST | Get category summary | None | JSON |
| `RocknRoll.php` | POST | Submit order | FormData | JSON |
| `oh.php` | POST | Get order statuses | JSON | JSON |
| `os.php` | POST | Get order summary | Form | HTML |
| `restore_order.php` | POST | Restore order | JSON | JSON |
| `check_delivery_demand.php` | POST | Check delivery demand | JSON | JSON |
| `stock_management.php` | GET | Get stock | Query | JSON |
