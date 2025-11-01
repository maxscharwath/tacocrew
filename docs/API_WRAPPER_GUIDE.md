# API Wrapper Implementation Guide

This document outlines the proposed structure for creating a modern REST API wrapper around the existing tacos ordering system.

## Architecture Overview

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Wrapper    │ ← New REST API Layer
│  (Node.js/Go)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Legacy PHP API │ ← Existing ajax/*.php endpoints
└─────────────────┘
```

## Proposed API Structure

### Base URL
```
https://api.tacos.com/v1
```

### Endpoints

#### 1. Resources Endpoint
```http
GET /api/resources
```

**Response:**
```json
{
  "viandes": [
    {
      "id": "viande_hachee",
      "name": "Viande Hachée",
      "available": true,
      "category": "standard"
    },
    {
      "id": "cordon_bleu",
      "name": "Cordon Bleu",
      "available": true,
      "category": "premium"
    }
  ],
  "sauces": [
    {
      "id": "harissa",
      "name": "Harissa",
      "available": true
    }
  ],
  "garnitures": [
    {
      "id": "salade",
      "name": "Salade",
      "available": true
    }
  ],
  "desserts": [
    {
      "id": "dessert_brownie",
      "name": "Brownie",
      "price": 4.00,
      "available": true
    }
  ],
  "boissons": [
    {
      "id": "boisson_coca",
      "name": "Coca Cola",
      "price": 2.50,
      "available": true
    }
  ],
  "extras": [
    {
      "id": "extra_frites",
      "name": "Frites",
      "price": 3.50,
      "available": true,
      "allows_free_sauce": true,
      "free_sauce_limit": 1
    }
  ]
}
```

#### 2. Cart Endpoints

##### Get Cart
```http
GET /api/cart
```

##### Add Taco
```http
POST /api/cart/tacos
Content-Type: application/json

{
  "size": "tacos_XL",
  "meats": [
    { "id": "viande_hachee", "quantity": 2 }
  ],
  "sauces": ["harissa", "algérienne", "blanche"],
  "garnitures": ["salade", "tomates", "oignons"],
  "note": "Pas trop épicé"
}
```

##### Update Taco
```http
PUT /api/cart/tacos/:id

{
  "size": "tacos_XL",
  "meats": [...],
  "sauces": [...],
  "garnitures": [...],
  "note": "Updated note"
}
```

##### Delete Taco
```http
DELETE /api/cart/tacos/:id
```

##### Add Extra
```http
POST /api/cart/extras

{
  "id": "extra_frites",
  "quantity": 2,
  "free_sauces": [
    { "id": "ketchup" }
  ]
}
```

##### Add Drink
```http
POST /api/cart/drinks

{
  "id": "boisson_coca",
  "quantity": 2
}
```

##### Add Dessert
```http
POST /api/cart/desserts

{
  "id": "dessert_brownie",
  "quantity": 1
}
```

#### 3. Order Endpoints

##### Create Order
```http
POST /api/orders
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

**Response:**
```json
{
  "orderId": "1234567890_abc123",
  "status": "pending",
  "total": 40.50,
  "estimatedDelivery": "15:30",
  "createdAt": "2024-01-15T14:30:00Z"
}
```

##### Get Order
```http
GET /api/orders/:id
```

##### Get Order Status
```http
GET /api/orders/:id/status
```

**Response:**
```json
{
  "orderId": "1234567890_abc123",
  "status": "confirmed",
  "updatedAt": "2024-01-15T14:31:00Z"
}
```

##### Restore Order
```http
POST /api/orders/:id/restore
```

**Response:**
```json
{
  "status": "success",
  "warnings": {
    "out_of_stock": ["Product Name"]
  }
}
```

#### 4. Delivery Endpoints

##### Get Time Slots
```http
GET /api/delivery/time-slots
```

**Response:**
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

## Implementation Steps

### Phase 1: API Wrapper Core
1. Create Express.js/FastAPI server
2. Implement CSRF token management
3. Create adapter layer for legacy endpoints
4. Implement request/response transformation

### Phase 2: Resource Endpoints
1. Implement `/api/resources`
2. Implement `/api/resources/stock`
3. Cache stock data (30s TTL)

### Phase 3: Cart Endpoints
1. Implement cart state management
2. Implement taco CRUD operations
3. Implement extras/drinks/desserts endpoints
4. Implement cart summary endpoint

### Phase 4: Order Endpoints
1. Implement order creation
2. Implement order status checking
3. Implement order restoration
4. Add rate limiting

### Phase 5: Delivery & Utilities
1. Implement time slot endpoints
2. Implement delivery demand checking
3. Add comprehensive error handling
4. Add request validation

## Example Implementation (Node.js/Express)

```javascript
// routes/cart.js
const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');

router.post('/tacos', async (req, res) => {
  try {
    const taco = await cartService.addTaco(req.body);
    res.json({ success: true, data: taco });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/tacos/:id', async (req, res) => {
  try {
    const taco = await cartService.updateTaco(req.params.id, req.body);
    res.json({ success: true, data: taco });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

```javascript
// services/cartService.js
const axios = require('axios');
const csrfToken = require('./csrfToken');

class CartService {
  async addTaco(tacoData) {
    // Transform new API format to legacy format
    const formData = this.transformTacoToFormData(tacoData);
    
    // Call legacy endpoint
    const response = await axios.post('/ajax/owt.php', formData, {
      headers: {
        'X-CSRF-Token': await csrfToken.get(),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Transform response to new format
    return this.transformResponseToTaco(response.data);
  }
  
  transformTacoToFormData(taco) {
    const formData = new URLSearchParams();
    formData.append('selectProduct', taco.size);
    
    taco.meats.forEach(meat => {
      formData.append('viande[]', meat.id);
      formData.append(`meat_quantity[${meat.id}]`, meat.quantity || 1);
    });
    
    taco.sauces.forEach(sauce => {
      formData.append('sauce[]', sauce);
    });
    
    taco.garnitures.forEach(garnish => {
      formData.append('garniture[]', garnish);
    });
    
    if (taco.note) {
      formData.append('tacosNote', taco.note);
    }
    
    return formData;
  }
}

module.exports = new CartService();
```

## Testing Strategy

1. **Unit Tests**: Test transformation functions
2. **Integration Tests**: Test adapter layer with legacy endpoints
3. **E2E Tests**: Test full flow from API to legacy system
4. **Load Tests**: Test rate limiting and performance

## Migration Path

1. **Dual Mode**: Run both APIs in parallel
2. **Gradual Migration**: Migrate clients one by one
3. **Monitor**: Track usage and errors
4. **Deprecate**: Remove legacy endpoints after full migration
