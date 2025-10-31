# Group Order Feature

## Overview

The group order feature allows multiple users to collaborate on a single order. One person starts a group order with a time limit, and others can add their items to it. When ready, the order can be submitted as a single order.

## Features

- ✅ **Time-limited orders**: Set expiration time (default: 30 minutes)
- ✅ **Multi-user collaboration**: Multiple users can add items
- ✅ **User tracking**: Each item tracks who added it
- ✅ **Order summary**: See total items, price, and participants
- ✅ **Manual close**: Order creator can close order early
- ✅ **Automatic expiration**: Orders expire automatically after time limit
- ✅ **REST API**: Full REST API support
- ✅ **Slack Bot**: Slack commands for group orders

## API Endpoints

### Create Group Order
```
POST /api/v1/group-orders
{
  "createdBy": {
    "id": "user123",
    "name": "John Doe"
  },
  "expiresInMinutes": 30,
  "name": "Optional order name"
}
```

### Get All Active Group Orders
```
GET /api/v1/group-orders
```

### Get Specific Group Order
```
GET /api/v1/group-orders/:id
```

### Add Item to Group Order
```
POST /api/v1/group-orders/:id/items
{
  "userId": "user456",
  "userName": "Jane Smith",
  "taco": {
    "size": "tacos_XL",
    "meats": [...],
    "sauces": [...],
    "garnitures": [...]
  },
  "quantity": 1
}
```

### Remove Item from Group Order
```
DELETE /api/v1/group-orders/:id/items/:itemId
{
  "userId": "user456"
}
```

### Close Group Order
```
POST /api/v1/group-orders/:id/close
{
  "userId": "user123"
}
```

### Submit Group Order
```
POST /api/v1/group-orders/:id/submit
{
  "customer": {
    "name": "John Doe",
    "phone": "+41791234567"
  },
  "delivery": {
    "type": "livraison",
    "address": "123 Rue Example",
    "requestedFor": "15:00"
  }
}
```

## Slack Bot Commands

### Start Group Order
```
/tacos-group-start [minutes]
```
Creates a new group order. Optional minutes parameter (default: 30).

### View Group Order
```
/tacos-group-view <order-id>
```
Shows details of a specific group order including all items and participants.

### List Active Group Orders
```
/tacos-group-list
```
Lists all currently active group orders.

## Usage Flow

1. **Start Order**: Someone starts a group order with `/tacos-group-start 30` (30 minutes)
2. **Share Order ID**: Share the order ID with others in the group
3. **Add Items**: Each person adds their items via API or Slack
4. **Monitor**: Use `/tacos-group-view` to see current items and time remaining
5. **Close/Submit**: When ready, close the order or submit it directly

## Implementation Details

### Storage
- In-memory storage (Map-based)
- Automatic cleanup of expired orders (runs every minute)
- Orders persist until explicitly deleted or expired

### Time Limits
- Set when creating order (`expiresInMinutes`)
- Automatically expires after time limit
- Can be manually closed by creator
- Expired orders cannot accept new items

### Order States
- `active` - Accepting new items
- `closed` - Manually closed, cannot accept new items
- `submitted` - Successfully submitted
- `expired` - Expired due to time limit

## TypeScript Types

All types are defined in `src/types/models.ts`:

- `GroupOrder` - Complete group order structure
- `GroupOrderItem` - Item with user info
- `GroupOrderStatus` - Order status enum
- `GroupOrderUser` - User information
- `CreateGroupOrderRequest` - Request to create order
- `AddItemToGroupOrderRequest` - Request to add item
- `SubmitGroupOrderRequest` - Request to submit order

## Example Usage

```typescript
import { getGroupOrderService } from '@/services/group-order.service';

const service = getGroupOrderService();

// Create order
const order = service.createGroupOrder({
  createdBy: { id: 'user1', name: 'John' },
  expiresInMinutes: 30
});

// Add item
service.addItem({
  orderId: order.id,
  userId: 'user2',
  userName: 'Jane',
  taco: {
    size: 'tacos_XL',
    meats: [{ slug: 'viande_hachee', name: 'Viande Hachée', quantity: 2 }],
    sauces: [{ slug: 'harissa', name: 'Harissa' }],
    garnitures: [{ slug: 'salade', name: 'Salade' }]
  }
});

// Submit
await service.submitGroupOrder({
  orderId: order.id,
  customer: { name: 'John', phone: '+41791234567' },
  delivery: { type: 'livraison', address: '123 Street' }
});
```
