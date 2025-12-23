# Mystery Taco Generation Flow

## Overview
Mystery tacos are generated when a user selects "mystery mode" in the order form. The generation happens **on the backend** when the order is submitted, not when the user toggles the switch.

## Flow Diagram

```
User Action (Frontend)
    ↓
1. User toggles mystery switch in TacoBuilder component
    ↓
2. useOrderForm hook sets kind = TacoKind.MYSTERY
    ↓
3. Form submission sends request with kind: 'mystery'
    ↓
Backend Processing
    ↓
4. CreateUserOrderUseCase.execute() receives request
    ↓
5. ItemEnricher.enrich() processes items
    ↓
6. TacoBuilderFactory.getBuilder(TacoKind.MYSTERY) returns MysteryTacoBuilder
    ↓
7. MysteryTacoBuilder.build() GENERATES the mystery taco object
    ↓
8. Mystery taco is saved to database
```

## Detailed Steps

### Frontend (User Selection)

**Location**: `apps/web/src/components/orders/TacoBuilder.tsx`
- User clicks the mystery toggle switch
- `onToggleMystery()` is called
- Sets `kind = TacoKind.MYSTERY` in form state
- Clears all ingredient selections (meats, sauces, garnitures)

**Location**: `apps/web/src/hooks/useOrderForm.ts`
```typescript
const toggleMystery = () => {
  if (kind === TacoKind.MYSTERY) {
    setKind(TacoKind.REGULAR);
  } else {
    // Turning on mystery - clear all ingredients
    setMeats([]);
    setSauces([]);
    setGarnitures([]);
    setKind(TacoKind.MYSTERY);
  }
};
```

### Frontend (Form Submission)

**Location**: `apps/web/src/routes/orders.create.tsx`
- Form data is parsed with `parseOrderFormData()`
- Request body is built with `buildUpsertOrderRequest()`
- Includes `kind: 'mystery'` in the taco object

**Location**: `apps/web/src/utils/order-request-builder.ts`
```typescript
const isMystery = data.kind === TacoKind.MYSTERY;
return {
  items: {
    tacos: [{
      size: data.size,
      meats: isMystery ? [] : [...],  // Empty for mystery
      sauces: isMystery ? [] : [...], // Empty for mystery
      garnitures: isMystery ? [] : [...], // Empty for mystery
      note: data.note,
      quantity: 1,
      kind: data.kind, // 'mystery' or 'regular'
    }],
    // ... other items
  }
};
```

### Backend (Order Processing)

**Location**: `apps/api/src/services/user-order/create-user-order.service.ts`
- `CreateUserOrderUseCase.execute()` receives the request
- Calls `processItems()` which uses `ItemEnricher.enrich()`

**Location**: `apps/api/src/services/user-order/processors/item-enricher.ts`
```typescript
static enrich(simpleItems, stock): UserOrderItems {
  const tacos = [];
  for (const simpleTaco of simpleItems.tacos) {
    const kind = simpleTaco.kind ?? TacoKind.REGULAR; // Gets 'mystery' from request
    const builder = TacoBuilderFactory.getBuilder(kind); // Returns MysteryTacoBuilder
    const quantity = simpleTaco.quantity ?? 1;
    
    // Create one taco object for each quantity
    for (let i = 0; i < quantity; i++) {
      tacos.push(builder.build(simpleTaco, stock)); // ⭐ GENERATES HERE
    }
  }
  return { tacos, ... };
}
```

### Backend (Mystery Taco Generation)

**Location**: `apps/api/src/services/user-order/builders/mystery-taco-builder.ts`
```typescript
export class MysteryTacoBuilder implements TacoBuilder {
  build(simpleTaco, stock): RegularTaco {
    const id = TacoId.create();
    
    // Get taco size constraints
    const tacoSize = stock.tacos.find((t) => t.code === simpleTaco.size);
    
    // ⭐ GENERATE RANDOM INGREDIENTS HERE (chef picks everything)
    const meats = this.generateRandomMeats(stock, tacoSize.maxMeats);
    const sauces = this.generateRandomSauces(stock, tacoSize.maxSauces);
    const garnitures = tacoSize.allowGarnitures
      ? this.generateRandomGarnitures(stock)
      : [];
    
    const price = PriceCalculator.calculateRegularTacoPrice(simpleTaco.size, meats, stock);
    
    return {
      id,
      size: simpleTaco.size,
      meats,      // ⭐ Randomly selected
      sauces,     // ⭐ Randomly selected
      garnitures, // ⭐ Randomly selected (if allowed)
      note: simpleTaco.note,
      price,
      kind: TacoKind.REGULAR, // Converted to regular taco since it has ingredients
      tacoID: generateTacoID(...), // ⭐ Generated from the recipe
    };
  }
}
```

**Key Change**: Mystery tacos are now **converted to regular tacos** with randomly generated ingredients when the order is submitted. The system tracks which tacos were originally mystery orders for badge tracking purposes.

## Key Points

1. **Generation Moment**: Mystery tacos are generated in `MysteryTacoBuilder.build()` when processing the order request
2. **Random Ingredients**: When a mystery order is submitted, the system **randomly generates ingredients** (meats, sauces, garnitures) from available stock
3. **Conversion to Regular Taco**: Mystery tacos are converted to `RegularTaco` objects with randomly selected ingredients
4. **tacoID Generated**: Since mystery tacos now have ingredients, a `tacoID` is generated from the recipe
5. **Price Calculation**: Uses `calculateRegularTacoPrice()` which considers size + meat prices
6. **Badge Tracking**: The system tracks which tacos were originally mystery orders (via `originallyMysteryTacoIds`) to trigger badge tracking (`mysteryTacoOrdered` event)
7. **Ingredient Selection**: 
   - Meats: Randomly selects 1 to `maxMeats` from available stock
   - Sauces: Randomly selects 1 to `maxSauces` from available stock
   - Garnitures: Randomly selects 0 to all available (if allowed by size)

## Differences from Regular Tacos

| Aspect | Regular Taco | Mystery Taco (Original Request) | Mystery Taco (After Generation) |
|--------|-------------|-------------------------------|----------------------------------|
| **Ingredients** | User selects | None (empty arrays) | **Randomly generated** from stock |
| **tacoID** | Generated from recipe | Not generated | **Generated from recipe** |
| **Price** | Size + meat prices | Size only (estimated) | Size + meat prices (actual) |
| **Generation** | `RegularTacoBuilder.build()` | `MysteryTacoBuilder.build()` | `MysteryTacoBuilder.build()` |
| **Final Kind** | `TacoKind.REGULAR` | `TacoKind.MYSTERY` (request) | `TacoKind.REGULAR` (stored) |
| **Badge Event** | `orderCreated` | `orderCreated` + `mysteryTacoOrdered` | `orderCreated` + `mysteryTacoOrdered` |

## Files Involved

### Frontend
- `apps/web/src/components/orders/TacoBuilder.tsx` - UI toggle
- `apps/web/src/hooks/useOrderForm.ts` - Form state management
- `apps/web/src/utils/order-request-builder.ts` - Request building
- `apps/web/src/routes/orders.create.tsx` - Form submission

### Backend
- `apps/api/src/services/user-order/create-user-order.service.ts` - Main use case
- `apps/api/src/services/user-order/processors/item-enricher.ts` - Item processing
- `apps/api/src/services/user-order/builders/taco-builder-factory.ts` - Builder selection
- `apps/api/src/services/user-order/builders/mystery-taco-builder.ts` - **⭐ Generation happens here**
- `apps/api/src/services/user-order/processors/price-calculator.ts` - Price calculation
- `apps/api/src/services/user-order/badge-tracker.ts` - Badge tracking

