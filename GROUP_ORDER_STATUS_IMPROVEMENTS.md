# Group Order Status Management Improvements

## Problem Statement

Previously, group orders could have a status of "open" even when they were outside their validity date range (startDate to endDate). This caused issues where:
- The frontend would show orders as "open" when they should be unavailable
- Users could attempt to add orders to expired group orders
- The system didn't clearly communicate when an order period had ended

## Solution: Separate Status and Availability

Instead of computing an "effective status" that replaces the original status, we added a separate boolean property `canAcceptOrders` that indicates whether the group order can accept new user orders.

### Benefits of This Approach:
1. **Preserves Original Status**: The database status (open, closed, submitted, completed) remains unchanged and accurate
2. **Clear Separation of Concerns**: Status represents the order's lifecycle state, while `canAcceptOrders` represents its availability
3. **Audit Trail**: We can distinguish between manually closed orders and orders that expired due to date range

## Changes Made

### 1. Backend Schema Changes

#### New Helper Function (`apps/backend/src/schemas/group-order.schema.ts`)
Added `canAcceptOrders()` function to determine availability:

```typescript
/**
 * Determine if a group order can accept new user orders.
 * 
 * Rules:
 * - Status must be OPEN (not closed, submitted, or completed)
 * - Current date must be within the validity period (startDate to endDate)
 */
export function canAcceptOrders(order: GroupOrder, referenceDate = new Date()): boolean {
  if (order.status !== GroupOrderStatus.OPEN) {
    return false;
  }

  return referenceDate >= order.startDate && referenceDate <= order.endDate;
}
```

### 2. Backend API Changes

#### Updated Response Schema (`apps/backend/src/api/routes/group-order.routes.ts`)
Added `canAcceptOrders` boolean to all group order API responses:

```typescript
const GroupOrderResponseSchema = z.object({
  id: z.string(),
  leaderId: z.string(),
  name: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  canAcceptOrders: z.boolean(),  // NEW PROPERTY
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
```

#### Modified API Endpoints:
- POST `/orders` (create group order)
- GET `/orders/{id}` (get group order)
- GET `/orders/{id}/items` (get group order with user orders)
- GET `/users/me/group-orders` (list user's group orders)

All endpoints now include:
```typescript
{
  // ... other properties
  status: groupOrder.status,  // Original DB status preserved
  canAcceptOrders: canAcceptOrders(groupOrder),  // Computed availability
}
```

### 3. Backend Validation Changes

#### Updated Submit Group Order Service (`apps/backend/src/services/group-order/submit-group-order.service.ts`)
Changed validation to check availability instead of just status:

**Before:**
```typescript
if (groupOrder.status !== GroupOrderStatus.OPEN) {
  throw new ValidationError(`Cannot submit group order. Group order status: ${groupOrder.status}`);
}
```

**After:**
```typescript
if (!canAcceptOrders(groupOrder)) {
  const reason =
    groupOrder.status !== GroupOrderStatus.OPEN
      ? `status is ${groupOrder.status}`
      : 'order period has expired';
  throw new ValidationError(`Cannot submit group order: ${reason}`);
}
```

**Note:** User order creation already uses `canGroupOrderBeModified()` which properly checks both status and date range, so no changes were needed there.

### 4. Frontend Changes

#### Order Detail Page (`apps/frontend/src/routes/orders.detail.tsx`)

**Updated availability checks:**
```typescript
// Before
const canAddOrders = groupOrder.status === 'open';
const canSubmit = isLeader && groupOrder.status === 'open';

// After
const canAddOrders = groupOrder.canAcceptOrders;
const canSubmit = isLeader && groupOrder.canAcceptOrders;
```

**Updated button logic:**
- Shows enabled "Create new order" button when `canAcceptOrders === true`
- Shows disabled button with appropriate message when `canAcceptOrders === false`
- Message determined by status:
  - status='open' & canAcceptOrders=false → "Order period expired"
  - status='closed' → "Order closed"
  - status='submitted' → "Order submitted"
  - status='completed' → "Order completed"

#### Dashboard & Orders List

**Simplified active order filtering:**

**Before:**
```typescript
const pendingOrders = groupOrders.filter(
  (order) => order.status === 'open' || order.status === 'closed'
);
const activeCount = groupOrders.filter(
  (order) => order.status === 'open' || order.status === 'closed'
).length;
```

**After:**
```typescript
const pendingOrders = groupOrders.filter((order) => order.canAcceptOrders);
const activeCount = groupOrders.filter((order) => order.canAcceptOrders).length;
```

## API Response Example

### Group Order with `canAcceptOrders`

**Case 1: Open order within date range**
```json
{
  "id": "abc123",
  "status": "open",
  "startDate": "2025-11-05T08:00:00Z",
  "endDate": "2025-11-05T18:00:00Z",
  "canAcceptOrders": true  // ✅ Can add orders
}
```

**Case 2: Open order past end date**
```json
{
  "id": "def456",
  "status": "open",
  "startDate": "2025-11-04T08:00:00Z",
  "endDate": "2025-11-04T18:00:00Z",
  "canAcceptOrders": false  // ❌ Expired (past endDate)
}
```

**Case 3: Manually closed order**
```json
{
  "id": "ghi789",
  "status": "closed",
  "startDate": "2025-11-05T08:00:00Z",
  "endDate": "2025-11-05T18:00:00Z",
  "canAcceptOrders": false  // ❌ Manually closed
}
```

**Case 4: Submitted order**
```json
{
  "id": "jkl012",
  "status": "submitted",
  "startDate": "2025-11-05T08:00:00Z",
  "endDate": "2025-11-05T18:00:00Z",
  "canAcceptOrders": false  // ❌ Already submitted
}
```

## Benefits

1. **Automatic Expiration**: Orders automatically become unavailable when outside their validity period
2. **Consistent UX**: Frontend accurately reflects the order's availability using a single boolean property
3. **Better Error Messages**: Users get clear feedback about why they can't add orders
4. **Preserved Status**: Original status field maintains its semantic meaning
5. **No Background Jobs**: Availability is computed on-demand, no need for scheduled tasks
6. **Simplified Logic**: Frontend just checks one boolean instead of multiple conditions

## Status vs Availability

| Status | Within Date Range | canAcceptOrders | UI Behavior |
|--------|-------------------|-----------------|-------------|
| open | ✅ Yes | ✅ true | Can add orders |
| open | ❌ No | ❌ false | Shows "Order period expired" |
| closed | ✅ Yes | ❌ false | Shows "Order closed" |
| closed | ❌ No | ❌ false | Shows "Order closed" |
| submitted | N/A | ❌ false | Shows "Order submitted" |
| completed | N/A | ❌ false | Shows "Order completed" |

## Testing Recommendations

1. **Create a group order with endDate in the past**
   - Should show status='open', canAcceptOrders=false
   - Button should show "Order period expired"

2. **Try to add user order to expired group order**
   - Should be blocked with error message

3. **Try to submit an expired group order**
   - Should fail with validation error

4. **Check dashboard counts**
   - Expired orders (canAcceptOrders=false) should not count as "active"

5. **Manually close an order**
   - Should show status='closed', canAcceptOrders=false
   - Button should show "Order closed"

## Database Schema

**No database changes required** - the `canAcceptOrders` property is computed at runtime from existing fields:
- `status` (database field)
- `startDate` (database field)
- `endDate` (database field)

## Future Enhancements

Possible improvements for future iterations:
1. Add visual countdown/timer showing time remaining before expiration
2. Allow leaders to extend the endDate of an order
3. Add notifications before order expires (e.g., "30 minutes remaining")
4. Archive expired orders after a certain period
5. Add analytics on expired vs submitted orders
