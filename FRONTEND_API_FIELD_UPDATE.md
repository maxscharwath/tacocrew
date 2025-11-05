# Frontend API Field Update - `canAcceptOrders`

## Summary

Updated frontend TypeScript types to properly handle the new `canAcceptOrders` boolean field added to the backend API responses.

## Changes Made

### 1. Updated TypeScript Type Definitions

**File:** `apps/frontend/src/lib/api/types.ts`

#### Added `canAcceptOrders` to `UserGroupOrder` interface:
```typescript
export interface UserGroupOrder {
  id: string;
  name: string | null;
  status: string;
  canAcceptOrders: boolean;  // ✅ NEW FIELD
  startDate: string;
  endDate: string;
  createdAt: string;
}
```

#### Added `canAcceptOrders` to `GroupOrder` interface:
```typescript
export interface GroupOrder {
  id: string;
  leaderId: string;
  name: string | null;
  startDate: string;
  endDate: string;
  status: string;
  canAcceptOrders: boolean;  // ✅ NEW FIELD
  createdAt?: string;
  updatedAt?: string;
}
```

### 2. API Client Functions (Already Typed)

The following API client functions automatically benefit from the updated types:

**File:** `apps/frontend/src/lib/api/orders.ts`
- `createGroupOrder()` → Returns `GroupOrder` with `canAcceptOrders`
- `getGroupOrder()` → Returns `GroupOrder` with `canAcceptOrders`
- `getGroupOrderWithOrders()` → Returns `GroupOrderWithUserOrders` containing `GroupOrder` with `canAcceptOrders`

**File:** `apps/frontend/src/lib/api/user.ts`
- `getGroupOrders()` → Returns `UserGroupOrder[]` with `canAcceptOrders`

### 3. Component Usage (Already Updated in Previous Changes)

All components already correctly use the `canAcceptOrders` field:

#### `apps/frontend/src/routes/orders.detail.tsx`
```typescript
const canAddOrders = groupOrder.canAcceptOrders;
const canSubmit = isLeader && groupOrder.canAcceptOrders;
```

#### `apps/frontend/src/routes/dashboard.tsx`
```typescript
const pendingOrders = groupOrders.filter((order) => order.canAcceptOrders);
```

#### `apps/frontend/src/routes/orders.list.tsx`
```typescript
const activeCount = groupOrders.filter((order) => order.canAcceptOrders).length;
```

## Type Safety Benefits

### Before (No Type for canAcceptOrders)
```typescript
// TypeScript would not catch this error:
const canAddOrders = groupOrder.canAcceptOrders; // ❌ Property doesn't exist on type
```

### After (Properly Typed)
```typescript
// TypeScript now provides:
// ✅ Autocomplete for canAcceptOrders
// ✅ Type checking at compile time
// ✅ IntelliSense documentation
const canAddOrders = groupOrder.canAcceptOrders; // ✅ boolean
```

## API Response Examples

### GET `/api/v1/orders/:id` Response
```typescript
{
  "id": "abc123",
  "leaderId": "user456",
  "name": "Team Lunch Order",
  "startDate": "2025-11-05T08:00:00Z",
  "endDate": "2025-11-05T18:00:00Z",
  "status": "open",
  "canAcceptOrders": true,  // ✅ Properly typed as boolean
  "createdAt": "2025-11-05T08:00:00Z",
  "updatedAt": "2025-11-05T08:00:00Z"
}
```

### GET `/api/v1/users/me/group-orders` Response
```typescript
[
  {
    "id": "abc123",
    "name": "Team Lunch Order",
    "status": "open",
    "canAcceptOrders": true,  // ✅ Properly typed as boolean
    "startDate": "2025-11-05T08:00:00Z",
    "endDate": "2025-11-05T18:00:00Z",
    "createdAt": "2025-11-05T08:00:00Z"
  }
]
```

## Component Type Inference

Components using `Awaited<ReturnType<...>>` automatically get the updated types:

```typescript
type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  // ✅ groupOrder now has canAcceptOrders: boolean
};

export function OrderDetailRoute() {
  const { groupOrder } = useLoaderData() as LoaderData;
  
  // ✅ TypeScript knows canAcceptOrders is a boolean
  const canAddOrders = groupOrder.canAcceptOrders;
}
```

## Backwards Compatibility

⚠️ **Breaking Change Note:**
This update requires the backend to always return `canAcceptOrders` in group order responses. Ensure backend is deployed before or simultaneously with this frontend update.

## Testing Checklist

- [x] TypeScript compilation passes
- [x] No linter errors
- [x] Types properly inferred in components
- [x] IntelliSense shows `canAcceptOrders` field
- [ ] Runtime testing: Group orders display correct availability
- [ ] Runtime testing: Expired orders show `canAcceptOrders: false`
- [ ] Runtime testing: Active orders show `canAcceptOrders: true`

## Files Modified

1. ✅ `apps/frontend/src/lib/api/types.ts`
   - Updated `UserGroupOrder` interface
   - Updated `GroupOrder` interface

## Related Backend Changes

This frontend update corresponds to the backend changes that added:
- `canAcceptOrders` property to all group order API responses
- `canAcceptOrders()` helper function in `group-order.schema.ts`
- Date range validation using `isWithinInterval` from date-fns

See `GROUP_ORDER_STATUS_IMPROVEMENTS.md` and `DATE_FNS_IMPROVEMENTS.md` for backend details.
