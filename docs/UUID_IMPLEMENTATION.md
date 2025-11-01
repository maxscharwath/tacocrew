# ✅ UUID Implementation Complete

## What Was Implemented

**Both carts AND tacos now use UUIDs!** The API is fully RESTful with UUID-based resource identification.

## API Structure

### Cart Operations
```
POST   /api/v1/carts                         → Generate cart UUID
GET    /api/v1/carts/{cartUUID}              → Get cart by UUID
```

### Taco Operations (UUID-based!)
```
POST   /api/v1/carts/{cartUUID}/tacos        → Add taco (returns taco with UUID)
GET    /api/v1/carts/{cartUUID}/tacos/{tacoUUID}  → Get taco by UUID
PUT    /api/v1/carts/{cartUUID}/tacos/{tacoUUID}  → Update taco by UUID
DELETE /api/v1/carts/{cartUUID}/tacos/{tacoUUID}  → Delete taco by UUID
PATCH  /api/v1/carts/{cartUUID}/tacos/{tacoUUID}/quantity → Update quantity
```

### Other Operations
```
POST   /api/v1/carts/{cartUUID}/extras       → Add extra
POST   /api/v1/carts/{cartUUID}/drinks       → Add drink
POST   /api/v1/carts/{cartUUID}/desserts     → Add dessert
POST   /api/v1/carts/{cartUUID}/orders       → Place order
GET    /api/v1/resources/stock               → Get stock (global)
```

## Example Usage

### 1. Create Cart
```bash
CART_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
# Or let API generate: curl -X POST http://localhost:4000/api/v1/carts
```

### 2. Add Taco (returns UUID)
```bash
RESPONSE=$(curl -X POST http://localhost:4000/api/v1/carts/$CART_ID/tacos \
  -H "Content-Type: application/json" \
  -d '{"size":"tacos_XL","meats":[{"id":"viande_hachee","quantity":2}],"sauces":["harissa"],"garnitures":["salade"]}')

# Extract taco UUID from response
TACO_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "Taco ID: $TACO_ID"
```

### 3. Edit Taco (using UUID)
```bash
curl -X PUT http://localhost:4000/api/v1/carts/$CART_ID/tacos/$TACO_ID \
  -H "Content-Type: application/json" \
  -d '{"size":"tacos_XXL","meats":[{"id":"viande_hachee","quantity":3}],"sauces":["harissa","algerienne"],"garnitures":["salade","tomates"]}'
```

### 4. Delete Taco (using UUID)
```bash
curl -X DELETE http://localhost:4000/api/v1/carts/$CART_ID/tacos/$TACO_ID
```

## JavaScript Client

```javascript
import { v4 as uuidv4 } from 'uuid';

class TacosAPI {
  constructor(cartId = null) {
    this.cartId = cartId || uuidv4();
  }

  async addTaco(taco) {
    const response = await fetch(`/api/v1/carts/${this.cartId}/tacos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taco)
    });
    const data = await response.json();
    return data.data;  // Returns { id: "uuid-...", size: "tacos_XL", ... }
  }

  async updateTaco(tacoId, taco) {
    return fetch(`/api/v1/carts/${this.cartId}/tacos/${tacoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taco)
    });
  }

  async deleteTaco(tacoId) {
    return fetch(`/api/v1/carts/${this.cartId}/tacos/${tacoId}`, {
      method: 'DELETE'
    });
  }
}

// Usage
const api = new TacosAPI();

// Add taco - save the UUID
const taco = await api.addTaco({
  size: 'tacos_XL',
  meats: [{ id: 'viande_hachee', quantity: 2 }],
  sauces: ['harissa'],
  garnitures: ['salade']
});
console.log(`Taco ID: ${taco.id}`);

// Edit using UUID
await api.updateTaco(taco.id, {
  size: 'tacos_XXL',
  meats: [{ id: 'viande_hachee', quantity: 3 }],
  sauces: ['harissa', 'algerienne'],
  garnitures: ['salade', 'tomates']
});

// Delete using UUID
await api.deleteTaco(taco.id);
```

## Implementation Details

### Type Changes
```typescript
// Before
interface Taco {
  id: number;  // ❌ Numeric index
  // ...
}

// After
interface Taco {
  id: string;  // ✅ UUID
  // ...
}
```

### Service Layer
The cart service maintains a mapping between backend indices (0, 1, 2...) and UUIDs:
- When adding a taco: generates UUID, stores mapping
- When editing/deleting: looks up backend index from UUID
- Client only sees UUIDs!

### Key Files Modified
1. `src/types/index.ts` - Taco.id changed to string
2. `src/services/cart.service.ts` - UUID generation and mapping
3. `src/controllers/api.controller.ts` - Accept UUID params
4. `src/web-api.ts` - Routes use UUID
5. `README.md` - Updated documentation
6. `examples/restful-usage.ts` - UUID examples

## Benefits

### ✅ Fully RESTful
- Resources identified by UUIDs
- No numeric indices exposed
- Standard REST conventions

### ✅ Client-Friendly
- UUIDs can be generated client-side
- No need to track numeric indices
- Predictable resource URLs

### ✅ Scalable
- UUIDs work across distributed systems
- No ID collisions
- Can cache by UUID

### ✅ Secure
- UUIDs are unpredictable
- Hard to enumerate resources
- Better than sequential IDs

## Testing

Run the examples:
```bash
npx ts-node examples/restful-usage.ts
```

Manual testing:
```bash
# Start server
npm run dev:api

# Test the flow
CART_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

# Add taco
curl -X POST http://localhost:4000/api/v1/carts/$CART_ID/tacos \
  -H "Content-Type: application/json" \
  -d '{"size":"tacos_L","meats":[{"id":"viande_hachee","quantity":1}],"sauces":["harissa"],"garnitures":["salade"]}' \
  | jq '.data.id'

# Use the returned UUID for edit/delete
```

## Summary

✅ **Carts**: Use UUID in path (`/carts/{uuid}`)  
✅ **Tacos**: Use UUID in path (`/tacos/{uuid}`)  
✅ **No headers**: Pure RESTful URLs  
✅ **No indices**: Only UUIDs exposed  
✅ **Fully typed**: TypeScript with UUID types  

**The API is now fully RESTful with UUID-based resources!** 🎉
