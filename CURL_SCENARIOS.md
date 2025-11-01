# 🧪 Complete cURL Scenarios for Tacos Ordering API

This document provides comprehensive curl examples for testing all API endpoints.

## Base Configuration

```bash
# Set these variables for easy testing
API_BASE="http://localhost:4000/api/v1"
BACKEND_URL="https://www.gt-lausanne.ch"  # Your backend URL
```

---

## Scenario 1: Create a New Cart

**Request:**
```bash
curl -X POST "${API_BASE}/carts" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v
```

**Expected Response:**
```json
{
  "cartId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Save cart ID for next steps:**
```bash
CART_ID=$(curl -s -X POST "${API_BASE}/carts" | jq -r '.cartId')
echo "Cart ID: ${CART_ID}"
```

---

## Scenario 2: Get Cart (Empty)

**Request:**
```bash
curl -X GET "${API_BASE}/carts/${CART_ID}" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

**Expected Response:**
```json
{
  "cartId": "550e8400-e29b-41d4-a716-446655440000",
  "session": {
    "csrfToken": "...",
    "cookies": {
      "PHPSESSID": "..."
    },
    "createdAt": "2025-10-31T22:55:28.000Z",
    "lastActivityAt": "2025-10-31T22:55:36.000Z"
  },
  "tacos": [],
  "extras": [],
  "drinks": [],
  "desserts": [],
  "summary": {
    "tacos": { "totalQuantity": 0, "totalPrice": 0 },
    "extras": { "totalQuantity": 0, "totalPrice": 0 },
    "boissons": { "totalQuantity": 0, "totalPrice": 0 },
    "desserts": { "totalQuantity": 0, "totalPrice": 0 },
    "total": { "quantity": 0, "price": 0 }
  }
}
```

---

## Scenario 3: Add Tacos to Cart

**Add a single XL taco with meat and sauces:**
```bash
curl -X POST "${API_BASE}/carts/${CART_ID}/tacos" \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [
      {"id": "viande_hachee", "quantity": 2},
      {"id": "poulet", "quantity": 1}
    ],
    "sauces": ["harissa", "algérienne"],
    "garnitures": ["salade", "tomates", "oignons"]
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

**Add another taco (XXL):**
```bash
curl -X POST "${API_BASE}/carts/${CART_ID}/tacos" \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XXL",
    "meats": [
      {"id": "viande_hachee", "quantity": 3}
    ],
    "sauces": ["harissa"],
    "garnitures": ["salade"]
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

---

## Scenario 4: Add Extras to Cart

```bash
curl -X POST "${API_BASE}/carts/${CART_ID}/extras" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "frites",
    "quantity": 2
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

---

## Scenario 5: Add Drinks to Cart

```bash
curl -X POST "${API_BASE}/carts/${CART_ID}/drinks" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "coca_cola",
    "quantity": 1
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

---

## Scenario 6: Add Desserts to Cart

```bash
curl -X POST "${API_BASE}/carts/${CART_ID}/desserts" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tiramisu",
    "quantity": 1
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

---

## Scenario 7: Get Updated Cart

```bash
curl -X GET "${API_BASE}/carts/${CART_ID}" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '{
    cartId: .cartId,
    totalItems: .summary.total.quantity,
    totalPrice: .summary.total.price,
    tacos: .tacos | length,
    extras: .extras | length,
    drinks: .drinks | length,
    desserts: .desserts | length
  }'
```

---

## Scenario 8: Get Specific Taco Details

**Get first taco (index 0):**
```bash
curl -X GET "${API_BASE}/carts/${CART_ID}/tacos/0" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

---

## Scenario 9: Update Taco

**Update the first taco:**
```bash
curl -X PUT "${API_BASE}/carts/${CART_ID}/tacos/0" \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XXL",
    "meats": [
      {"id": "viande_hachee", "quantity": 4}
    ],
    "sauces": ["harissa", "algérienne", "samouraï"],
    "garnitures": ["salade", "tomates", "oignons", "cornichons"]
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

---

## Scenario 10: Update Taco Quantity

**Increase quantity by 1:**
```bash
curl -X PATCH "${API_BASE}/carts/${CART_ID}/tacos/0/quantity" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "increment"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

**Decrease quantity by 1:**
```bash
curl -X PATCH "${API_BASE}/carts/${CART_ID}/tacos/0/quantity" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "decrement"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

---

## Scenario 11: Delete Taco

```bash
curl -X DELETE "${API_BASE}/carts/${CART_ID}/tacos/0" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n"
```

---

## Scenario 12: Create an Order

```bash
curl -X POST "${API_BASE}/carts/${CART_ID}/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "+41791234567",
    "orderType": "livraison",
    "address": "Rue de la Paix 1, 1000 Lausanne",
    "requestedFor": "2025-11-01 19:30"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

**Expected Response:**
```json
{
  "orderId": "ORD-12345",
  "status": "pending",
  "price": 45.50,
  "estimatedDelivery": "2025-11-01 19:30"
}
```

**For takeaway order:**
```bash
curl -X POST "${API_BASE}/carts/${CART_ID}/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Jane Smith",
    "customerPhone": "+41798765432",
    "orderType": "emporter",
    "requestedFor": "2025-11-01 18:00"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

---

## Scenario 13: Get Stock Availability

```bash
curl -X GET "${API_BASE}/resources/stock" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '{
    meats: .meats | keys | length,
    sauces: .sauces | keys | length,
    garnitures: .garnitures | keys | length,
    drinks: .drinks | keys | length,
    desserts: .desserts | keys | length
  }'
```

**Get specific category stock:**
```bash
curl -X GET "${API_BASE}/resources/stock" \
  -H "Content-Type: application/json" \
  | jq '.meats | to_entries | map(select(.value.in_stock == false)) | map(.key)'
```

---

## Scenario 14: Health Check

```bash
curl -X GET "http://localhost:4000/health" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.'
```

---

## Complete Flow Example

**Full ordering flow:**
```bash
#!/bin/bash

API_BASE="http://localhost:4000/api/v1"

echo "=== 1. Creating Cart ==="
CART_ID=$(curl -s -X POST "${API_BASE}/carts" | jq -r '.cartId')
echo "Cart ID: ${CART_ID}"

echo -e "\n=== 2. Adding Tacos ==="
curl -s -X POST "${API_BASE}/carts/${CART_ID}/tacos" \
  -H "Content-Type: application/json" \
  -d '{
    "size": "tacos_XL",
    "meats": [{"id": "viande_hachee", "quantity": 2}],
    "sauces": ["harissa"],
    "garnitures": ["salade", "tomates"]
  }' | jq '.id, .size, .price'

echo -e "\n=== 3. Adding Extras ==="
curl -s -X POST "${API_BASE}/carts/${CART_ID}/extras" \
  -H "Content-Type: application/json" \
  -d '{"id": "frites", "quantity": 1}' | jq '.'

echo -e "\n=== 4. Adding Drink ==="
curl -s -X POST "${API_BASE}/carts/${CART_ID}/drinks" \
  -H "Content-Type: application/json" \
  -d '{"id": "coca_cola", "quantity": 1}' | jq '.'

echo -e "\n=== 5. Getting Cart Summary ==="
curl -s -X GET "${API_BASE}/carts/${CART_ID}" \
  | jq '{
    totalItems: .summary.total.quantity,
    totalPrice: .summary.total.price,
    breakdown: {
      tacos: .summary.tacos.totalPrice,
      extras: .summary.extras.totalPrice,
      drinks: .summary.boissons.totalPrice,
      desserts: .summary.desserts.totalPrice
    }
  }'

echo -e "\n=== 6. Creating Order ==="
curl -s -X POST "${API_BASE}/carts/${CART_ID}/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerPhone": "+41791234567",
    "orderType": "livraison",
    "address": "123 Test St, Lausanne",
    "requestedFor": "2025-11-01 20:00"
  }' | jq '.'

echo -e "\n=== Done ==="
```

---

## Error Scenarios

### Invalid Cart ID
```bash
curl -X GET "${API_BASE}/carts/invalid-cart-id" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n"
```

### Invalid Taco ID
```bash
curl -X GET "${API_BASE}/carts/${CART_ID}/tacos/999" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n"
```

### Missing Required Fields
```bash
curl -X POST "${API_BASE}/carts/${CART_ID}/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"
```

---

## Using jq for Better Output

**Install jq (if not installed):**
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

**Pretty print JSON:**
```bash
curl -s "${API_BASE}/carts/${CART_ID}" | jq '.'
```

**Extract specific fields:**
```bash
curl -s "${API_BASE}/carts/${CART_ID}" | jq '.summary.total'
```

**Filter and transform:**
```bash
curl -s "${API_BASE}/carts/${CART_ID}" | jq '.tacos[] | {size, price, meats: .meats | length}'
```

---

## Testing Tips

1. **Save cart ID to variable:**
   ```bash
   export CART_ID=$(curl -s -X POST "${API_BASE}/carts" | jq -r '.cartId')
   ```

2. **Use verbose mode for debugging:**
   ```bash
   curl -v -X GET "${API_BASE}/carts/${CART_ID}"
   ```

3. **Check response headers:**
   ```bash
   curl -i -X GET "${API_BASE}/carts/${CART_ID}"
   ```

4. **Test with timeout:**
   ```bash
   curl --max-time 10 -X GET "${API_BASE}/carts/${CART_ID}"
   ```

5. **Follow redirects:**
   ```bash
   curl -L -X GET "${API_BASE}/carts/${CART_ID}"
   ```

---

## Environment-Specific Testing

**Development (localhost):**
```bash
API_BASE="http://localhost:4000/api/v1"
```

**Production:**
```bash
API_BASE="https://api.yourdomain.com/api/v1"
```

**With authentication (if added later):**
```bash
curl -X GET "${API_BASE}/carts/${CART_ID}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

