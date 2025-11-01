# TypeScript DI Libraries Comparison

## TSyringe ⭐ (Recommended)
**Why it's better:**
- ✅ **Simpler API** - Less boilerplate than Inversify
- ✅ **Microsoft maintained** - Well-supported
- ✅ **Clean decorators** - `@singleton()`, `@injectable()`
- ✅ **No symbol tokens needed** - Can use class constructors directly
- ✅ **Better TypeScript inference**
- ✅ **Circular dependency support**

**Example:**
```typescript
@singleton()
export class CartService {
  constructor(
    @inject(SessionApiClient) private sessionApiClient: SessionApiClient
  ) {}
}

// Usage - just inject!
const cartService = container.resolve(CartService);
```

## InversifyJS (Current)
**Issues:**
- ❌ More verbose (requires symbols/TYPES)
- ❌ More boilerplate
- ❌ More complex setup

## TypeDI
**Pros:**
- Simple API
- Good for smaller projects

**Cons:**
- Less popular
- Smaller community

## Awilix
**Pros:**
- Very clean functional API
- No decorators needed
- Great for functional style

**Cons:**
- Different paradigm
- Less TypeScript-native

## ITI (Modern Choice)
**Pros:**
- Ultra lightweight (1kB)
- Type-safe
- No decorators needed
- React-friendly

**Cons:**
- Newer, smaller ecosystem

