# Tacos Ordering API Documentation

## Overview

This document describes the API endpoints used by the tacos ordering system. The goal is to create a modern REST API wrapper that abstracts these endpoints into a clean, maintainable interface.

## Base URL

All endpoints are prefixed with `/ajax/` except where noted.

## Authentication

All endpoints require a CSRF token in the `X-CSRF-Token` header. The token can be obtained from the page or refreshed via the refresh token endpoint.

---

## Endpoints

### 1. Authentication & Security

#### Refresh CSRF Token
- **Endpoint**: `GET /ajax/refresh_token.php`
- **Description**: Refreshes the CSRF token
- **Headers**: None
- **Response**:
  ```json
  {
    "csrf_token": "token_string"
  }
  ```
- **Refresh Interval**: Every 30 minutes (1800000ms)

---

### 2. Resources

#### Get Stock Availability
- **Endpoint**: `GET /office/stock_management.php?type=all`
- **Description**: Get stock status for all products (viandes, sauces, garnitures, desserts, boissons, extras)
- **Response**:
  ```json
  {
    "viandes": {
      "viande_hachee": { "in_stock": true },
      "escalope_de_poulet": { "in_stock": false }
    },
    "sauces": { ... },
    "garnitures": { ... },
    "desserts": { ... },
    "boissons": { ... },
    "extras": { ... }
  }
  ```

---

### 3. Cart Management

#### Add Taco to Cart
- **Endpoint**: `POST /ajax/owt.php`
- **Description**: Add a new taco to the cart
- **Headers**: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}`
- **Body** (FormData):
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
- **Taco Sizes**: `tacos_L`, `tacos_BOWL`, `tacos_L_mixte`, `tacos_XL`, `tacos_XXL`, `tacos_GIGA`
- **Response**: HTML string (taco card HTML)
- **Note**: Maximum 3 sauces, meat quantities depend on taco size

#### Update Taco Quantity
- **Endpoint**: `POST /ajax/owt.php`
- **Description**: Increase or decrease taco quantity
- **Headers**: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}`
- **Body**:
  ```
  action=increaseQuantity|decreaseQuantity
  index={tacoIndex}
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "quantity": 2
  }
  ```

#### Get Cart Tacos
- **Endpoint**: `POST /ajax/owt.php`
- **Description**: Load all tacos currently in cart
- **Headers**: `X-CSRF-Token: {token}`
- **Body**:
  ```json
  {
    "loadProducts": true
  }
  ```
- **Response**: HTML string (all taco cards)

#### Get Taco Details (for editing)
- **Endpoint**: `POST /ajax/gtd.php`
- **Description**: Get details of a specific taco for editing
- **Headers**: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}`
- **Body**:
  ```
  index={tacoIndex}
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "taille": "tacos_XL",
      "viande": [
        { "slug": "viande_hachee", "quantity": 2, "name": "Viande Hachée" }
      ],
      "garniture": [
        { "slug": "salade", "name": "Salade" }
      ],
      "sauce": [
        { "slug": "harissa", "name": "Harissa" }
      ],
      "tacosNote": "Pas trop épicé"
    }
  }
  ```

#### Update Taco
- **Endpoint**: `POST /ajax/et.php`
- **Description**: Update an existing taco in the cart
- **Headers**: 
  - `Content-Type: multipart/form-data`
  - `X-CSRF-Token: {token}`
- **Body** (FormData):
  ```
  editSelectProduct={tacoSize}
  viande[]={meat1}
  sauce[]={sauce1}
  garniture[]={garnish1}
  tacosNote={note}
  meat_quantity[{meatSlug}]={quantity}
  ```
- **Response**: HTML string (updated taco card)

#### Delete Taco
- **Endpoint**: `POST /ajax/dt.php`
- **Description**: Remove a taco from cart
- **Headers**: `X-CSRF-Token: {token}`
- **Body**:
  ```json
  {
    "index": 0
  }
  ```
- **Response**: Success status

#### Add Extra (Snack)
- **Endpoint**: `POST /ajax/ues.php`
- **Description**: Add an extra item (frites, nuggets, etc.) to cart
- **Headers**: `X-CSRF-Token: {token}`
- **Body**:
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
      { "id": "sauce1", "name": "Sauce 1", "price": 0 },
      { "id": "sauce2", "name": "Sauce 2", "price": 0 }
    ]
  }
  ```
- **Response**: JSON status

#### Get Selected Extras
- **Endpoint**: `POST /ajax/gse.php`
- **Description**: Get all extras currently in cart
- **Headers**: `X-CSRF-Token: {token}`
- **Response**:
  ```json
  {
    "extra_frites": {
      "id": "extra_frites",
      "quantity": 2,
      "free_sauce": { "id": "...", "name": "..." },
      "free_sauces": [...]
    }
  }
  ```

#### Add Drink
- **Endpoint**: `POST /ajax/ubs.php`
- **Description**: Add a drink to cart
- **Headers**: `X-CSRF-Token: {token}`
- **Body**:
  ```json
  {
    "id": "boisson_coca",
    "name": "Coca Cola",
    "price": 2.50,
    "quantity": 1
  }
  ```
- **Response**: JSON status

#### Get Selected Drinks
- **Endpoint**: `POST /ajax/gsb.php`
- **Description**: Get all drinks currently in cart
- **Headers**: `X-CSRF-Token: {token}`
- **Response**:
  ```json
  {
    "boisson_coca": {
      "id": "boisson_coca",
      "quantity": 2
    }
  }
  ```

#### Add Dessert
- **Endpoint**: `POST /ajax/uds.php`
- **Description**: Add a dessert to cart
- **Headers**: `X-CSRF-Token: {token}`
- **Body**:
  ```json
  {
    "id": "dessert_brownie",
    "name": "Brownie",
    "price": 4.00,
    "quantity": 1
  }
  ```
- **Response**: JSON status

#### Get Selected Desserts
- **Endpoint**: `POST /ajax/gsd.php`
- **Description**: Get all desserts currently in cart
- **Headers**: `X-CSRF-Token: {token}`
- **Response**:
  ```json
  {
    "dessert_brownie": {
      "id": "dessert_brownie",
      "quantity": 1
    }
  }
  ```

#### Get Cart Summary
- **Endpoint**: `POST /ajax/cs.php`
- **Description**: Get HTML summary of cart
- **Headers**: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}`
- **Response**:
  ```json
  {
    "message": "<div>Cart HTML...</div>"
  }
  ```

#### Get Category Summary
- **Endpoint**: `POST /ajax/sd.php`
- **Description**: Get summary by category (tacos, extras, boissons, desserts)
- **Headers**: `X-CSRF-Token: {token}`
- **Response**:
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

---

### 4. Orders

#### Submit Order
- **Endpoint**: `POST /ajax/RocknRoll.php`
- **Description**: Finalize and submit an order
- **Headers**: 
  - `Content-Type: multipart/form-data`
  - `X-CSRF-Token: {token}`
- **Body** (FormData):
  ```
  name={customer_name}
  phone={phone_number}
  confirmPhone={confirm_phone}
  address={delivery_address}
  type={livraison|emporter}
  requestedFor={time_slot}
  transaction_id={unique_id}
  ```
- **Response**:
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
- **Error Codes**:
  - `409`: Duplicate order
  - `403`: Rate limit exceeded (1 order per minute) or forbidden
- **Rate Limit**: 1 order per minute

#### Get Order Statuses
- **Endpoint**: `POST /ajax/oh.php`
- **Description**: Check status of multiple orders
- **Headers**: 
  - `Content-Type: application/json`
  - `X-CSRF-Token: {token}`
- **Body**:
  ```json
  {
    "orders": [
      { "orderId": "1234567890_abc123" },
      { "orderId": "1234567890_def456" }
    ]
  }
  ```
- **Response**:
  ```json
  [
    {
      "orderId": "1234567890_abc123",
      "status": "confirmed"
    }
  ]
  ```
- **Order Statuses**: `pending`, `confirmed`, `ondelivery`, `delivered`, `cancelled`

#### Get Order Summary
- **Endpoint**: `POST /ajax/os.php`
- **Description**: Get HTML summary of current cart for order modal
- **Headers**: 
  - `Content-Type: application/x-www-form-urlencoded`
  - `X-CSRF-Token: {token}`
- **Body**:
  ```
  csrf_token={token}
  ```
- **Response**: HTML string

#### Restore Order (Repeat Order)
- **Endpoint**: `POST /ajax/restore_order.php`
- **Description**: Restore a previous order to cart
- **Headers**: `X-CSRF-Token: {token}`
- **Body**:
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
- **Response**:
  ```json
  {
    "status": "success" | "warning",
    "out_of_stock_items": ["Product Name 1", "Product Name 2"]
  }
  ```

#### Check Delivery Demand
- **Endpoint**: `POST /ajax/check_delivery_demand.php`
- **Description**: Check if a time slot has high delivery demand
- **Headers**: 
  - `Content-Type: application/json`
  - `X-CSRF-TOKEN: {token}`
- **Body** (single time):
  ```json
  {
    "time": "15:00"
  }
  ```
- **Body** (all times):
  ```json
  {
    "check_all": true
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "is_high_demand": true,
    "message": "Forte affluence à cette heure"
  }
  ```
- **Response (all times)**:
  ```json
  {
    "status": "success",
    "time_slots": {
      "15:00": { "is_high_demand": true },
      "15:00:00": { "is_high_demand": true }
    }
  }
  ```

---

## Data Structures

### Order Object
```json
{
  "orderId": "1234567890_abc123",
  "OrderData": {
    "status": "pending",
    "type": "livraison",
    "date": "2024-01-15 14:30:00",
    "price": 40.50,
    "requestedFor": "15:00",
    "tacos": [
      {
        "name": "Tacos XL",
        "quantity": 1,
        "price": 12.50,
        "viande": [
          { "name": "Viande Hachée", "quantity": 2 }
        ],
        "garniture": [
          { "name": "Salade" }
        ],
        "sauce": [
          { "name": "Harissa" }
        ],
        "tacosNote": "Pas trop épicé"
      }
    ],
    "extras": [
      {
        "name": "Frites",
        "quantity": 1,
        "price": 3.50,
        "free_sauce": { "name": "Ketchup" }
      }
    ],
    "boissons": [
      {
        "name": "Coca Cola",
        "quantity": 2,
        "price": 2.50
      }
    ],
    "desserts": [
      {
        "name": "Brownie",
        "quantity": 1,
        "price": 4.00
      }
    ]
  }
}
```

### Taco Size Limits
- `tacos_L`: 1 meat, 3 sauces max
- `tacos_BOWL`: 2 meats, 3 sauces max, no garnitures
- `tacos_L_mixte`: 3 meats, 3 sauces max
- `tacos_XL`: 3 meats, 3 sauces max
- `tacos_XXL`: 4 meats, 3 sauces max
- `tacos_GIGA`: 5 meats, 3 sauces max

---

## Proposed New API Structure

### REST API Endpoints

#### Resources
- `GET /api/resources` - List all resources (viandes, sauces, garnitures, desserts, boissons, extras)
- `GET /api/resources/stock` - Get stock availability

#### Cart
- `GET /api/cart` - Get current cart contents
- `POST /api/cart/tacos` - Add taco to cart
- `PUT /api/cart/tacos/:id` - Update taco
- `DELETE /api/cart/tacos/:id` - Remove taco from cart
- `POST /api/cart/extras` - Add extra to cart
- `POST /api/cart/drinks` - Add drink to cart
- `POST /api/cart/desserts` - Add dessert to cart
- `GET /api/cart/summary` - Get cart summary

#### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/:id/status` - Get order status
- `POST /api/orders/:id/restore` - Restore order to cart
- `GET /api/orders` - List user orders

#### Delivery
- `GET /api/delivery/time-slots` - Get available time slots
- `GET /api/delivery/demand/:time` - Check delivery demand for time slot

---

## Implementation Notes

1. **CSRF Protection**: All endpoints require CSRF token validation
2. **Rate Limiting**: Order submission limited to 1 per minute
3. **Stock Management**: Products can be marked as out of stock
4. **Order States**: Orders progress through: pending → confirmed → ondelivery → delivered
5. **Business Hours**: Orders can only be repeated during business hours (10:00-21:00, except weekends)
6. **Delivery Fee**: 2.00 CHF for delivery orders
7. **Free Sauces**: Certain extras (frites, nuggets, etc.) can include free sauces

---

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `403`: Forbidden (CSRF invalid, rate limit exceeded)
- `409`: Conflict (duplicate order)
- `500`: Server error

Error responses include a message field:
```json
{
  "status": "error",
  "message": "Error description"
}
```
